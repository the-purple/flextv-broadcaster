import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { EPlatformState, EStreamingState } from 'services/streaming';
import { $t } from 'services/i18n';
import { confirmAsync } from 'components-react/modals';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import * as remote from '@electron/remote';

export default function StartStreamingButton(p: { disabled?: boolean }) {
  const {
    StreamingService,
    StreamSettingsService,
    UserService,
    CustomizationService,
    MediaBackupService,
    SourcesService,
    FlexTvService,
  } = Services;

  const { streamingStatus, platformStatus, delayEnabled, delaySeconds } = useVuex(() => ({
    streamingStatus: StreamingService.state.streamingStatus,
    platformStatus: StreamingService.state.platformStatus,
    delayEnabled: StreamingService.views.delayEnabled,
    delaySeconds: StreamingService.views.delaySeconds,
  }));

  const [delaySecondsRemaining, setDelayTick] = useState(delaySeconds);

  useEffect(() => {
    setDelayTick(delaySeconds);
  }, [streamingStatus]);

  useEffect(() => {
    if (
      delayEnabled &&
      delaySecondsRemaining > 0 &&
      (streamingStatus === EStreamingState.Starting || streamingStatus === EStreamingState.Ending)
    ) {
      const interval = window.setTimeout(() => {
        setDelayTick(delaySecondsRemaining - 1);
      }, 1000);
      return () => {
        clearTimeout(interval);
      };
    }
  }, [delaySecondsRemaining, streamingStatus, delayEnabled]);

  async function toggleStreaming() {
    if (StreamingService.isStreaming || StreamingService.isPaused) {
      await confirmAsync({
        type: 'warning',
        title: '방송을 종료하시겠습니까?',
        content: '종료를 선택하시면 즉시 방송이 종료 됩니다.',
        okText: '종료',
        cancelText: $t('Cancel'),
      }).then((isOk: boolean) => {
        if (!isOk) return;
        if (StreamingService.isPaused) {
          return StreamingService.finishPlatformStream();
        } else {
          return StreamingService.toggleStreaming();
        }
      });
    } else {
      const streamStatus = await FlexTvService.checkReadyToStream();
      if (!streamStatus.success) {
        if (streamStatus.error?.code === 'NO_AUTH') {
          await confirmAsync({
            content: '방송은 본인인증후 이용이 가능합니다.',
            okText: '인증하러 가기',
            cancelText: $t('Cancel'),
          }).then((isOk: boolean) => {
            if (isOk) {
              remote.shell.openExternal(FlexTvService.apiBase);
            }
          });
          return;
        } else if (streamStatus.error?.code === 'CREATING') {
          await confirmAsync({
            type: 'success',
            content: '방송 송출을 위한 준비를 완료 하였습니다.',
          });
        }
      }

      const needToShowNoSourcesWarning =
        StreamSettingsService.settings.warnNoVideoSources &&
        SourcesService.views.getSources().filter(source => source.type !== 'scene' && source.video)
          .length === 0;

      if (needToShowNoSourcesWarning) {
        const goLive = await remote.dialog
          .showMessageBox(remote.getCurrentWindow(), {
            title: $t('No Sources'),
            type: 'warning',
            message:
              // tslint:disable-next-line prefer-template
              $t(
                "It looks like you haven't added any video sources yet, so you will only be outputting a black screen.",
              ) +
              ' ' +
              $t('Are you sure you want to do this?') +
              '\n\n' +
              $t('You can add sources by clicking the + icon near the Sources box at any time'),
            buttons: [$t('Cancel'), $t('Go Live Anyway')],
          })
          .then(({ response }) => !!response);

        if (!goLive) return;
      }
      if (!StreamingService.views.hasPendingChecks()) {
        StreamingService.actions.resetInfo();
      }
      StreamingService.actions.showGoLiveWindow();
    }
  }

  function handleTogglePause() {
    if (streamingStatus === EStreamingState.Live) {
      return StreamingService.pauseStreaming();
    } else {
      return StreamingService.replayStreaming();
    }
  }

  const getIsRedButton =
    streamingStatus !== EStreamingState.Offline || platformStatus === EPlatformState.Live;

  const isDisabled =
    p.disabled ||
    (streamingStatus === EStreamingState.Starting && delaySecondsRemaining === 0) ||
    (streamingStatus === EStreamingState.Ending && delaySecondsRemaining === 0);

  return (
    <>
      <button
        style={{ minWidth: '130px' }}
        className={cx('button button--action', { 'button--soft-warning': getIsRedButton })}
        disabled={isDisabled}
        onClick={toggleStreaming}
      >
        <StreamButtonLabel
          streamingStatus={streamingStatus}
          platformStatus={platformStatus}
          delayEnabled={delayEnabled}
          delaySecondsRemaining={delaySecondsRemaining}
        />
      </button>
    </>
  );
}

function PauseButton(p: { streamingStatus: EStreamingState; onClick: () => {} }) {
  return p.streamingStatus === EStreamingState.Live ? (
    <button className="button button--default" style={{ marginRight: 15 }} onClick={p.onClick}>
      <strong>방송송출 일시정지</strong>
    </button>
  ) : (
    <button className="button button--prime" style={{ marginRight: 15 }} onClick={p.onClick}>
      <strong>방송송출 정지해제</strong>
    </button>
  );
}

function StreamButtonLabel(p: {
  streamingStatus: EStreamingState;
  platformStatus: EPlatformState;
  delaySecondsRemaining: number;
  delayEnabled: boolean;
}) {
  if (p.streamingStatus === EStreamingState.Live || p.platformStatus === EPlatformState.Live) {
    return <>{$t('End Stream')}</>;
  }

  if (p.streamingStatus === EStreamingState.Starting) {
    if (p.delayEnabled) {
      return <>{`Starting ${p.delaySecondsRemaining}s`}</>;
    }

    return <>{$t('Starting')}</>;
  }

  if (p.streamingStatus === EStreamingState.Ending) {
    if (p.delayEnabled) {
      return <>{`Discard ${p.delaySecondsRemaining}s`}</>;
    }

    return <>{$t('Ending')}</>;
  }

  if (p.streamingStatus === EStreamingState.Reconnecting) {
    return <>{$t('Reconnecting')}</>;
  }

  return <>{$t('Go Live')}</>;
}

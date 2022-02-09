import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { EStreamingState } from 'services/streaming';
import { EGlobalSyncStatus } from 'services/media-backup';
import { $t } from 'services/i18n';
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

  const { streamingStatus, delayEnabled, delaySeconds } = useVuex(() => ({
    streamingStatus: StreamingService.state.streamingStatus,
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
    if (StreamingService.isStreaming) {
      const options = {
        type: 'warning',
        buttons: ['종료', '취소'],
        title: '방송을 종료하시겠습니까?',
        message: '종료를 선택하시면 즉시 방송이 종료 됩니다.',
      };
      const response = await remote.dialog.showMessageBox(
        remote.getCurrentWindow(),
        options,
      );
      if (response.response === 0) {
        StreamingService.toggleStreaming();
      }
    } else {
      if (MediaBackupService.views.globalSyncStatus === EGlobalSyncStatus.Syncing) {
        const goLive = await remote.dialog
          .showMessageBox(remote.getCurrentWindow(), {
            title: $t('Cloud Backup'),
            type: 'warning',
            message:
              $t('Your media files are currently being synced with the cloud. ') +
              $t('It is recommended that you wait until this finishes before going live.'),
            buttons: [$t('Wait'), $t('Go Live Anyway')],
          })
          .then(({ response }) => !!response);

        if (!goLive) return;
      }

      const streamStatus = await FlexTvService.checkReadyToStream();
      if (!streamStatus.success) {
        if (streamStatus.error?.code === 'NO_AUTH') {
          await remote.dialog
            .showMessageBox(remote.getCurrentWindow(), {
              title: '안내',
              type: 'warning',
              message: '방송은 본인인증후 이용이 가능합니다.',
              buttons: [$t('Cancel'), '본인 인증하러 가기'],
            })
            .then(({ response: isOk }) => {
              if (isOk) {
                remote.shell.openExternal(FlexTvService.apiBase);
              }
            });
          return;
        } else if (streamStatus.error?.code === 'CREATING') {
          await remote.dialog
            .showMessageBox(remote.getCurrentWindow(), {
              title: '안내',
              type: 'info',
              message: '방송 송출을 위한 준비를 완료 하였습니다.',
            })
            .then(({ response: isOk }) => {
              if (isOk) {
                remote.shell.openExternal(FlexTvService.apiBase);
              }
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

  const getIsRedButton = streamingStatus !== EStreamingState.Offline;

  const isDisabled =
    p.disabled ||
    (streamingStatus === EStreamingState.Starting && delaySecondsRemaining === 0) ||
    (streamingStatus === EStreamingState.Ending && delaySecondsRemaining === 0);

  return (
    <button
      style={{ minWidth: '130px' }}
      className={cx('button button--action', { 'button--soft-warning': getIsRedButton })}
      disabled={isDisabled}
      onClick={toggleStreaming}
    >
      <StreamButtonLabel
        streamingStatus={streamingStatus}
        delayEnabled={delayEnabled}
        delaySecondsRemaining={delaySecondsRemaining}
      />
    </button>
  );
}

function StreamButtonLabel(p: {
  streamingStatus: EStreamingState;
  delaySecondsRemaining: number;
  delayEnabled: boolean;
}) {
  if (p.streamingStatus === EStreamingState.Live) {
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

  return (
    <>
      <i className="icon-button icon-broadcast" style={{ color: '#fff' }} />
      {$t('Go Live')}
    </>
  );
}

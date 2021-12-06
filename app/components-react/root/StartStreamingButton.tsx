import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { EStreamingState } from 'services/streaming';
import { EGlobalSyncStatus } from 'services/media-backup';
import Utils from 'services/utils';
import electron from 'electron';
import { $t } from 'services/i18n';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';

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
      StreamingService.toggleStreaming();
    } else {
      if (MediaBackupService.views.globalSyncStatus === EGlobalSyncStatus.Syncing) {
        const goLive = await electron.remote.dialog
          .showMessageBox(electron.remote.getCurrentWindow(), {
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
          await electron.remote.dialog
            .showMessageBox(electron.remote.getCurrentWindow(), {
              title: '안내',
              type: 'warning',
              message: '방송은 본인인증후 이용이 가능합니다.',
              buttons: [$t('Cancel'), '본인 인증하러 가기'],
            })
            .then(({ response: isOk }) => {
              if (isOk) {
                electron.remote.shell.openExternal(FlexTvService.apiBase);
              }
            });
          return;
        } else if (streamStatus.error?.code === 'CREATING') {
          await electron.remote.dialog
            .showMessageBox(electron.remote.getCurrentWindow(), {
              title: '안내',
              type: 'info',
              message:
                '방송 송출을 위한 설정키를 발급 중입니다. 약 1분여 정도의 시간이 소요됩니다.',
            })
            .then(({ response: isOk }) => {
              if (isOk) {
                electron.remote.shell.openExternal(FlexTvService.apiBase);
              }
            });
          await Utils.sleep(30 * 1000);
        }
      }

      const needToShowNoSourcesWarning =
        StreamSettingsService.settings.warnNoVideoSources &&
        SourcesService.views.getSources().filter(source => source.type !== 'scene' && source.video)
          .length === 0;

      if (needToShowNoSourcesWarning) {
        const goLive = await electron.remote.dialog
          .showMessageBox(electron.remote.getCurrentWindow(), {
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

      if (shouldShowGoLiveWindow()) {
        if (!StreamingService.views.hasPendingChecks()) {
          StreamingService.actions.resetInfo();
        }
        StreamingService.actions.showGoLiveWindow();
      } else {
        StreamingService.actions.goLive();
      }
    }
  }

  const getIsRedButton = streamingStatus !== EStreamingState.Offline;

  const isDisabled =
    p.disabled ||
    (streamingStatus === EStreamingState.Starting && delaySecondsRemaining === 0) ||
    (streamingStatus === EStreamingState.Ending && delaySecondsRemaining === 0);

  function shouldShowGoLiveWindow() {
    if (!UserService.isLoggedIn) return false;
    const primaryPlatform = UserService.state.auth?.primaryPlatform;
    const updateStreamInfoOnLive = CustomizationService.state.updateStreamInfoOnLive;

    if (primaryPlatform === 'twitch') {
      // For Twitch, we can show the Go Live window even with protected mode off
      // This is mainly for legacy reasons.
      return StreamingService.views.isMultiplatformMode || updateStreamInfoOnLive;
    }

    if (primaryPlatform === 'facebook') {
      return (
        StreamSettingsService.state.protectedModeEnabled &&
        StreamSettingsService.isSafeToModifyStreamKey()
      );
    }

    if (primaryPlatform === 'youtube') {
      return (
        StreamSettingsService.state.protectedModeEnabled &&
        StreamSettingsService.isSafeToModifyStreamKey()
      );
    }

    if (primaryPlatform === 'tiktok') {
      return (
        StreamSettingsService.state.protectedModeEnabled &&
        StreamSettingsService.isSafeToModifyStreamKey()
      );
    }

    if (primaryPlatform === 'flextv') {
      return true;
    }
  }

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

  return <>{$t('Go Live')}</>;
}

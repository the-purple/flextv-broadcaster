import React, { useState } from 'react';
import * as remote from '@electron/remote';
import { useVuex } from 'components-react/hooks';
import { ObsSettingsSection } from './ObsSettings';
import { $t } from '../../../services/i18n';
import { alertAsync, confirmAsync } from '../../modals';
import { CheckboxInput } from '../../shared/inputs';
import { Services } from '../../service-provider';
import fs from 'fs';
import path from 'path';
import { getDefined } from '../../../util/properties-type-guards';

export function GeneralSettings() {
  return (
    <div>
      <FlexTVSettings />
      <CacheSettings />
      <ExtraSettings />
    </div>
  );
}

GeneralSettings.page = 'General';

function FlexTVSettings() {
  const { CustomizationService } = Services;
  const { enableFlexTVOptimization } = useVuex(() => {
    return { enableFlexTVOptimization: CustomizationService.state.enableFlexTVOptimization };
  });
  return (
    <ObsSettingsSection>
      <p>플렉스티비에 최적화된 설정을 사용하시면 방송 시작 시 일부 설정이 강제로 변경됩니다.</p>
      <CheckboxInput
        name="최적화 설정 사용"
        label="플렉스티비에 최적화 설정 사용"
        value={enableFlexTVOptimization}
        onChange={val =>
          CustomizationService.actions.setSettings({ enableFlexTVOptimization: val })
        }
      />
    </ObsSettingsSection>
  );
}

function CacheSettings() {
  const { AppService, CacheUploaderService, CustomizationService } = Services;
  const [cacheUploading, setCacheUploading] = useState(false);
  const { enableCrashDumps } = useVuex(() => {
    return { enableCrashDumps: CustomizationService.state.enableCrashDumps };
  });

  async function showCacheDir() {
    await remote.shell.openPath(AppService.appDataDirectory);
  }

  async function deleteCacheDir() {
    if (
      await confirmAsync(
        $t(
          'WARNING! You will lose all stream and encoder settings. If you are logged in, your scenes and sources will be restored from the cloud. This cannot be undone.',
        ),
      )
    ) {
      remote.app.relaunch({ args: ['--clearCacheDir'] });
      remote.app.quit();
    }
  }

  return (
    <ObsSettingsSection>
      <p>
        {$t(
          'Deleting your cache directory will cause you to lose some settings. Do not delete your cache directory unless instructed to do so by a Streamlabs staff member.',
        )}
      </p>
      <div className="input-container">
        <a className="link" onClick={showCacheDir}>
          <i className="icon-view" /> <span>{$t('Show Cache Directory')}</span>
        </a>
      </div>
      <div className="input-container">
        <a className="link" onClick={deleteCacheDir}>
          <i className="icon-trash" />
          <span>{$t('Delete Cache and Restart')}</span>
        </a>
      </div>
      {process.platform === 'win32' && (
        <CheckboxInput
          name="enable_dump_upload"
          label={$t('Enable reporting additional information on a crash (requires restart)')}
          value={enableCrashDumps}
          onChange={val => CustomizationService.actions.setSettings({ enableCrashDumps: val })}
        />
      )}
    </ObsSettingsSection>
  );
}

function ExtraSettings() {
  const {
    UserService,
    StreamingService,
    StreamSettingsService,
    CustomizationService,
    AppService,
    OnboardingService,
    WindowsService,
    StreamlabelsService,
    RecordingModeService,
    SettingsService,
  } = Services;
  const isLoggedIn = UserService.isLoggedIn;
  const isTwitch = isLoggedIn && getDefined(UserService.platform).type === 'twitch';
  const isFacebook = isLoggedIn && getDefined(UserService.platform).type === 'facebook';
  const isYoutube = isLoggedIn && getDefined(UserService.platform).type === 'youtube';
  const protectedMode = StreamSettingsService.state.protectedModeEnabled;
  const disableHAFilePath = path.join(AppService.appDataDirectory, 'HADisable');
  const [disableHA, setDisableHA] = useState(() => fs.existsSync(disableHAFilePath));
  const { isRecordingOrStreaming, recordingMode, updateStreamInfoOnLive } = useVuex(() => ({
    isRecordingOrStreaming: StreamingService.isStreaming || StreamingService.isRecording,
    recordingMode: RecordingModeService.views.isRecordingModeEnabled,
    updateStreamInfoOnLive: CustomizationService.state.updateStreamInfoOnLive,
  }));
  const canRunOptimizer =
    // HDR Settings are not compliant with the auto-optimizer
    !SettingsService.views.hasHDRSettings && isTwitch && !isRecordingOrStreaming && protectedMode;

  function restartStreamlabelsSession() {
    StreamlabelsService.restartSession().then(result => {
      if (result) {
        alertAsync($t('Stream Labels session has been successfully restarted!'));
      }
    });
  }

  function runAutoOptimizer() {
    OnboardingService.actions.start({ isOptimize: true });
    WindowsService.actions.closeChildWindow();
  }

  function configureDefaults() {
    OnboardingService.actions.start({ isHardware: true });
    WindowsService.actions.closeChildWindow();
  }

  function importFromObs() {
    OnboardingService.actions.start({ isImport: true });
    WindowsService.actions.closeChildWindow();
  }

  function disableHardwareAcceleration(val: boolean) {
    try {
      if (val) {
        // Touch the file
        fs.closeSync(fs.openSync(disableHAFilePath, 'w'));
        setDisableHA(true);
      } else {
        fs.unlinkSync(disableHAFilePath);
        setDisableHA(false);
      }
    } catch (e: unknown) {
      console.error('Error setting hardware acceleration', e);
    }
  }

  return (
    <>
      <ObsSettingsSection>
        <CheckboxInput
          label={$t('Disable hardware acceleration (requires restart)')}
          value={disableHA}
          onChange={disableHardwareAcceleration}
          name="disable_ha"
        />
        <CheckboxInput
          label={$t('Disable live streaming features (Recording Only mode)')}
          value={recordingMode}
          onChange={RecordingModeService.actions.setRecordingMode}
        />

        <div className="actions">
          <div className="input-container">
            <button className="button button--default" onClick={restartStreamlabelsSession}>
              다시 시작
            </button>
          </div>
        </div>
      </ObsSettingsSection>

      <ObsSettingsSection>
        <div className="actions">
          <div className="input-container">
            <button className="button button--default" onClick={configureDefaults}>
              {$t('Configure Default Devices')}
            </button>
          </div>
          {canRunOptimizer && (
            <div className="input-container">
              <button className="button button--default" onClick={runAutoOptimizer}>
                {$t('Auto Optimize')}
              </button>
            </div>
          )}

          <div className="input-container">
            <button className="button button--default" onClick={importFromObs}>
              {$t('OBS Import')}
            </button>
          </div>
        </div>
      </ObsSettingsSection>
    </>
  );
}

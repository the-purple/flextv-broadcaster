import React, { useState } from 'react';
import { ObsGenericSettingsForm, ObsSettingsSection } from './ObsSettings';
import { $t, I18nService } from '../../../services/i18n';
import { alertAsync, confirmAsync } from '../../modals';
import { CheckboxInput, ListInput } from '../../shared/inputs';
import electron from 'electron';
import { Services } from '../../service-provider';
import fs from 'fs';
import path from 'path';
import { useVuex } from '../../hooks';
import { useBinding } from '../../store';
import { getDefined } from '../../../util/properties-type-guards';

export function GeneralSettings() {
  return (
    <div>
      <FlexTVSettings />
      <CacheSettings />
      <LanguageSettings />
      <ExtraSettings />
      <ObsGenericSettingsForm />
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
      <p>플렉스티비에 최적화된 설정을 사용하시면 일부 설정이 강제로 변경됩니다.</p>
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
    await electron.remote.shell.openPath(AppService.appDataDirectory);
  }

  async function deleteCacheDir() {
    if (
      await confirmAsync(
        $t(
          'WARNING! You will lose all stream and encoder settings. If you are logged in, your scenes and sources will be restored from the cloud. This cannot be undone.',
        ),
      )
    ) {
      electron.remote.app.relaunch({ args: ['--clearCacheDir'] });
      electron.remote.app.quit();
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

function LanguageSettings() {
  const i18nService = I18nService.instance as I18nService;
  const localeOptions = i18nService.state.localeList;
  const currentLocale = i18nService.state.locale;

  async function save(lang: string) {
    if (!(await confirmAsync('This action will restart the application. Continue?'))) {
      return;
    }
    i18nService.actions.setLocale(lang);
  }

  return (
    <ObsSettingsSection>
      <ListInput options={localeOptions} label={'Language'} onChange={save} value={currentLocale} />
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
  } = Services;
  const isLoggedIn = UserService.isLoggedIn;
  const isTwitch = isLoggedIn && getDefined(UserService.platform).type === 'twitch';
  const isFacebook = isLoggedIn && getDefined(UserService.platform).type === 'facebook';
  const isYoutube = isLoggedIn && getDefined(UserService.platform).type === 'youtube';
  const isRecordingOrStreaming = StreamingService.isStreaming || StreamingService.isRecording;
  const protectedMode = StreamSettingsService.state.protectedModeEnabled;
  const canRunOptimizer = isTwitch && !isRecordingOrStreaming && protectedMode;
  const disableHAFilePath = path.join(AppService.appDataDirectory, 'HADisable');
  const [disableHA, setDisableHA] = useState(() => fs.existsSync(disableHAFilePath));

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

  const bind = useBinding({
    get streamInfoUpdate() {
      return CustomizationService.state.updateStreamInfoOnLive;
    },
    set streamInfoUpdate(value) {
      CustomizationService.setUpdateStreamInfoOnLive(value);
    },
  });

  return (
    <>
      <ObsSettingsSection>
        <CheckboxInput
          label={$t('Disable hardware acceleration (requires restart)')}
          value={disableHA}
          onChange={disableHardwareAcceleration}
          name="disable_ha"
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

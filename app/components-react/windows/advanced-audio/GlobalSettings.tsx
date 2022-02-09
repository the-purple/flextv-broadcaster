import React, { useState, useRef, useMemo } from 'react';
import { Provider } from 'react-redux';
import { BoolButtonInput, ListInput, SwitchInput } from 'components-react/shared/inputs';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
import { TObsValue, IObsListInput, IObsInput } from 'components/obs/inputs/ObsInput';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import styles from './AdvancedAudio.m.less';
import { ObsSettings, ObsSettingsSection } from '../../windows/settings/ObsSettings';
import { store } from '../../store';

const trackOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
];

export default function GlobalSettings() {
  const { SettingsService, UserService } = Services;

  const {
    advancedAudioSettings,
    isAdvancedOutput,
    audioTracks,
    streamTrack,
    vodTrack,
    vodTrackEnabled,
    isTwitchAuthed,
    recFormat,
  } = useVuex(() => ({
    advancedAudioSettings: SettingsService.views.advancedAudioSettings,
    isAdvancedOutput: SettingsService.views.isAdvancedOutput,
    audioTracks: SettingsService.views.audioTracks,
    streamTrack: SettingsService.views.streamTrack,
    vodTrack: SettingsService.views.vodTrack,
    vodTrackEnabled: SettingsService.views.vodTrackEnabled,
    isTwitchAuthed: UserService.views.isTwitchAuthed,
    recFormat: SettingsService.views.recFormat,
  }));

  const monitoringDevice = advancedAudioSettings?.parameters.find(
    param => param.name === 'MonitoringDeviceName',
  ) as IObsListInput<TObsValue>;
  const audioDucking = advancedAudioSettings?.parameters.find(
    param => param.name === 'DisableAudioDucking',
  ) as IObsInput<boolean>;

  function handleAdvancedSettingsChange(name: string, value: TObsValue) {
    SettingsService.actions.setSettingValue('Advanced', name, value);
  }

  function handleTracksChange(index: number, value: boolean) {
    const newArray = [...audioTracks];
    newArray[index] = Number(value);
    const newValue = Utils.binnaryArrayToNumber([...newArray].reverse());
    SettingsService.actions.setSettingValue('Output', 'RecTracks', newValue);
  }

  function handleOutputSettingsChange(type: string, value: number | boolean) {
    SettingsService.actions.setSettingValue('Output', type, value);
  }

  return (
    <>
      <ObsSettingsSection>
        {monitoringDevice && (
          <ListInput
            label={monitoringDevice.description}
            value={monitoringDevice.value}
            options={monitoringDevice.options.map(opt => ({
              value: opt.value,
              label: opt.description,
            }))}
            onChange={(value: string) =>
              handleAdvancedSettingsChange('MonitoringDeviceName', value)
            }
          />
        )}
        {audioDucking && (
          <SwitchInput
            label={audioDucking.description}
            value={audioDucking.value}
            onChange={(value: boolean) =>
              handleAdvancedSettingsChange('DisableAudioDucking', value)
            }
          />
        )}
        {isAdvancedOutput && (
          <ListInput
            label={$t('Streaming Track')}
            value={streamTrack + 1}
            options={trackOptions}
            onChange={value => handleOutputSettingsChange('TrackIndex', value)}
          />
        )}
        {isAdvancedOutput && isTwitchAuthed && (
          <SwitchInput
            label={$t('Enable Twitch VOD Track')}
            value={vodTrackEnabled}
            onChange={value => handleOutputSettingsChange('VodTrackEnabled', value)}
          />
        )}
        {isAdvancedOutput && vodTrackEnabled && (
          <ListInput
            label={$t('Twitch VOD Track')}
            value={vodTrack + 1}
            options={trackOptions.filter(opt => opt.value !== streamTrack + 1)}
            onChange={value => handleOutputSettingsChange('VodTrackIndex', value)}
          />
        )}
        {isAdvancedOutput && (
          <InputWrapper
            label={$t('Audio Tracks')}
            tooltip={$t('Designates which tracks are being recorded')}
            layout="horizontal"
            style={{ flexWrap: 'nowrap' }}
          >
            <div className={styles.globalAudioTracks}>
              {audioTracks.map((track, i) => (
                <BoolButtonInput
                  label={String(i + 1)}
                  key={i}
                  value={!!track}
                  checkboxStyles={{ marginRight: '4px' }}
                  name={`flag${track}`}
                  onChange={(value: boolean) => handleTracksChange(i, value)}
                  disabled={recFormat === 'flv'}
                />
              ))}
            </div>
          </InputWrapper>
        )}
      </ObsSettingsSection>
      <Provider store={store}>
        <ObsSettings page="Audio" />
      </Provider>
    </>
  );
}

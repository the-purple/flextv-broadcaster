import React from 'react';
import { IWidgetCommonState, useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t } from '../../services/i18n';
import { SliderInput, SwitchInput } from '../shared/inputs';
import { metadata } from '../shared/inputs/metadata';
import FormFactory from 'components-react/shared/inputs/FormFactory';

interface IEmoteWallState extends IWidgetCommonState {
  data: {
    settings: {
      combo_count: number;
      combo_required: boolean;
      combo_timeframe: number; // milliseconds
      emote_animation_duration: number; // milliseconds
      emote_scale: number;
      enabled: boolean;
      ignore_duplicates: boolean;
    };
  };
}

export function EmoteWall() {
  const { isLoading, settings, meta, updateSetting } = useEmoteWall();

  // use 1 column layout
  return (
    <WidgetLayout>
      {!isLoading && <FormFactory metadata={meta} values={settings} onChange={updateSetting} />}
    </WidgetLayout>
  );
}

export class EmoteWallModule extends WidgetModule<IEmoteWallState> {
  get isComboRequired() {
    return this.settings?.combo_required;
  }

  get meta() {
    return {
      enabled: { type: 'switch', label: $t('Enabled') },
      emote_animation_duration: metadata.seconds({ label: $t('Duration'), min: 1000, max: 60000 }),
      emote_scale: metadata.slider({ label: $t('Emote Scale'), min: 1, max: 10 }),
      combo_required: {
        type: 'switch',
        label: $t('Combo Required'),
        children: {
          combo_count: metadata.slider({
            label: $t('Combo Count'),
            min: 2,
            max: 100,
            displayed: this.settings?.combo_required,
          }),
          combo_timeframe: metadata.seconds({
            label: $t('Combo Timeframe'),
            min: 1000,
            max: 60000,
            displayed: this.settings?.combo_required,
          }),
        },
      },
      ignore_duplicates: { type: 'switch', label: $t('Ignore Duplicates') },
    };
  }
}

function useEmoteWall() {
  return useWidget<EmoteWallModule>();
}

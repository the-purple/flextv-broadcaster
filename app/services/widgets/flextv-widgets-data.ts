import { WidgetType } from './widgets-data';

export const FlexTvWidgetTypeNames = [
  'FlexChatBox',
  'FlexAlertBox',
  'FlexGoal',
  'FlexSponsorBanner',
  'FlexClock',
];

export const FlexTvWidgetTypes = [
  WidgetType.FlexChatBox,
  WidgetType.FlexAlertBox,
  WidgetType.FlexGoal,
  WidgetType.FlexSponsorBanner,
  WidgetType.FlexClock,
];

export const FlexTvWidgetTypeKey = {
  [WidgetType.FlexChatBox]: 'chat',
  [WidgetType.FlexAlertBox]: 'info',
  [WidgetType.FlexGoal]: 'target',
  [WidgetType.FlexSponsorBanner]: 'sponsor',
  [WidgetType.FlexClock]: 'clock',
};

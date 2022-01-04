import { IWidget } from './widgets-api';
import { AnchorPoint } from 'util/ScalableRectangle';

export interface IFlexTVWidgetDisplayData {
  name: string;
  description: string;
  icon: string;
  supportList: string[];
}
// Do not alter the order of this enum, it is coupled to the user's local config
export enum FlexTVWidgetType {
  ChatBox,
  AlertBox = 1,
  Goal = 2,
  SponsorBanner = 3,
  Clock,
}

export const FlexTVWidgetDefinitions: { [x: number]: IWidget } = {
  [FlexTVWidgetType.ChatBox]: {
    name: 'Alert Box',
    url(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    },

    width: 800,
    height: 600,

    x: 0.5,
    y: 0,

    anchor: AnchorPoint.North,
  },
  [FlexTVWidgetType.AlertBox]: {
    name: 'Alert Box',
    url(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    },

    width: 800,
    height: 600,

    x: 0.5,
    y: 0,

    anchor: AnchorPoint.North,
  },
  [FlexTVWidgetType.Goal]: {
    name: 'Alert Box',
    url(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    },

    width: 800,
    height: 600,

    x: 0.5,
    y: 0,

    anchor: AnchorPoint.North,
  },
  [FlexTVWidgetType.SponsorBanner]: {
    name: 'Alert Box',
    url(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    },

    width: 800,
    height: 600,

    x: 0.5,
    y: 0,

    anchor: AnchorPoint.North,
  },
  [FlexTVWidgetType.Clock]: {
    name: 'Alert Box',
    url(host, token) {
      return `https://${host}/alert-box/v3/${token}`;
    },

    width: 800,
    height: 600,

    x: 0.5,
    y: 0,

    anchor: AnchorPoint.North,
  },
};

export const FlexTVWidgetDisplayData = (): { [x: number]: IFlexTVWidgetDisplayData } => ({
  [FlexTVWidgetType.ChatBox]: {
    name: '채팅',
    description: '다양한 스타일로 나만의 개성있는 채팅창을 꾸미고 방송화면에 표시할 수 있습니다.',
    supportList: [],
    icon: 'fas fa-bell',
  },
  [FlexTVWidgetType.AlertBox]: {
    name: '알림',
    description:
      '후원 내용을 알림으로 방송화면에 표시해주며, 후원한 시청자의 채팅 내용을 음성으로 읽어줍니다.',
    supportList: [],
    icon: 'fas fa-calendar',
  },
  [FlexTVWidgetType.Goal]: {
    name: '목표치',
    description:
      '후원개수, 백두산 등 특별한 목표치를 설정하여 그래프와 퍼센트로 방송화면에 표시할 수 있습니다.',
    supportList: [],
    icon: 'fas fa-calendar',
  },
  [FlexTVWidgetType.SponsorBanner]: {
    name: '후원자막',
    description: '후원순위를 다양한 색상과 배경으로 방송화면에 표시할 수 있습니다.',
    supportList: [],
    icon: 'fas fa-calendar',
  },
  [FlexTVWidgetType.Clock]: {
    name: '시계',
    description: '방송화면에 표시할 시계를 설정할 수 있습니다.',
    supportList: [],
    icon: 'fas fa-calendar',
  },
});

import { EPlatformCallResult, IPlatformRequest, IPlatformService, IUserInfo } from '.';
import { jfetch } from 'util/requests';
import { InheritMutations, Inject } from '../core';
import { BasePlatformService } from './base-platform';
import { IPlatformState, TPlatformCapability } from './index';
import { IGoLiveSettings } from '../streaming';
import { platformAuthorizedRequest } from './utils';
import { CustomizationService } from 'services/customization';
import * as remote from '@electron/remote';

// https://www.flextv.co.kr/api/versions/latest/pc-caster - 현재 caster 최신 버전

export interface IFlextvStartStreamOptions {
  title: string;
  theme?: string;
  resolution?: string;
  minRatingLevel?: number;
  userAgentType?: string;
  password?: string;
  isForAdult?: boolean;
  maxViewerCount?: number;
  useAltThumbUrl?: number;
  useHigh?: number;
}

export interface IFlexTvTheme {
  key: string;
  value: string;
  text: string;
}

export interface IFlexTvCommonResponse {
  success: boolean;
  error?: {
    message?: string;
    code: string;
  };
}

interface IFlexTvServiceState extends IPlatformState {
  settings: IFlextvStartStreamOptions;
}

interface IFlexTvWidget {
  url: string;
  type: string;
  name: string;
}

const isProd = process.env.NODE_ENV === 'production';

const BASE_URL = isProd ? 'https://www.flextv.co.kr' : 'https://www.hotaetv.com';
const HELPER_BASE_URL = isProd ? 'https://api.flexhp.kr' : 'https://api.stage.flexhp.kro.kr';

@InheritMutations()
export class FlexTvService
  extends BasePlatformService<IFlexTvServiceState>
  implements IPlatformService {

  @Inject() private customizationService: CustomizationService;

  static initialState: IFlexTvServiceState = {
    ...BasePlatformService.initialState,
    settings: { title: '' },
  };

  readonly baseUrl = BASE_URL;
  readonly apiBase = BASE_URL;
  readonly platform = 'flextv';
  readonly displayName = 'FlexTV';
  readonly capabilities = new Set<TPlatformCapability>(['resolutionPreset']);

  readonly inputResolution = '1280x720';
  readonly outputResolution = '1280x720';

  widgets: IFlexTvWidget[] = []
  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  get authUrl() {
    return `${this.apiBase}/login`;
  }

  get streamPageUrl() {
    return `${this.apiBase}/channels/${this.channelId}/live`;
  }

  private get apiToken() {
    return this.userService.views.state.auth?.platforms?.flextv?.token;
  }

  private get channelId() {
    return this.userService.views.state.auth?.platforms?.flextv?.channelId;
  }

  private findOBSEncoderOptions(): string[] {
    if (!this.settingsService.views.state?.Output?.formData) return [];

    const forms = this.settingsService.views.state.Output.formData;
    const streamSetting = forms.find(f => f.nameSubCategory === 'Streaming');
    if (!streamSetting) return [];

    const param = streamSetting.parameters.find(p =>
      ['StreamEncoder', 'Encoder'].includes(p.description),
    );
    if (!param) return [];
    // @ts-ignore
    return param.options.map((o: any) => o.value);
  }

  private setOptimizedOBSSettings() {
    if (!this.customizationService.state.enableFlexTVOptimization) return;

    const encoderOptions = this.findOBSEncoderOptions();
    const hardwareEncoders = encoderOptions.filter(e => e !== 'obs_x264');
    if (hardwareEncoders.length > 0) {
      const defaultEncoder = hardwareEncoders[hardwareEncoders.length - 1];
      this.settingsService.setSettingValue('Output', 'StreamEncoder', defaultEncoder);
      this.settingsService.setSettingValue('Output', 'Encoder', defaultEncoder);
      this.settingsService.setSettingValue('Output', 'preset', 'llhp');
      this.settingsService.setSettingValue('Output', 'keyint_sec', 1);
    } else {
      /**
       * Optimization for NCP Live Station
       * https://guide.ncloud-docs.com/docs/media-livestation-livestation-encoderguide
       */
      this.settingsService.setSettingValue(
        'Output',
        'x264opts',
        '8x8dct=1 aq-mode=2 b-adapt=2 bframes=3 direct=auto keyint=150 me=umh merange=24 min-keyint=auto mixed-refs=1 partitions=i4 x4,p8x8,b8x8 profile=main rc-lookahead=60 ref=3 scenecut=40 subme=7 threads=0 trellis=1 weightb=1 weightp=2 ratetol=0.1 debloc k=1:0 qcomp=0.1 qpmax=69 qpmin=3 qpstep=4 vbv-bufsize=2000 vbv-maxrate=1800',
      );
    }

    this.settingsService.setSettingValue('Video', 'FPSCommon', '29.97');
    this.settingsService.setSettingValue('Advanced', 'RetryDelay', 5);
    this.settingsService.setSettingValue('Advanced', 'MaxRetries', 1000);
    this.settingsService.setSettingValue('Advanced', 'LowLatencyEnable', true);
    this.settingsService.setSettingValue('Advanced', 'DynamicBitrate', true);
    this.settingsService.setSettingValue('Advanced', 'DelayPreserve', false);
    this.settingsService.setSettingValue('Output', 'RecRB', false);
  }

  async beforeGoLive(goLiveSettings?: IGoLiveSettings) {
    if (
      this.streamSettingsService.protectedModeEnabled &&
      this.streamSettingsService.isSafeToModifyStreamKey()
    ) {
      this.setOptimizedOBSSettings();

      let data = await this.fetchStreamPair();
      if (!data || !data.streamKey) {
        data = await this.registerNewStreamKey();
      }
      if (!data || !data.streamKey) {
        await remote.dialog.showMessageBox({
          type: 'error',
          message: '일시적인 오류가 발생하였습니다. 오류가 지속될 경우 문의 부탁드립니다.',
          title: '송출 오류',
        });
        return;
      }
      this.SET_STREAM_KEY(data.streamKey);
      if (!this.streamingService.views.isMultiplatformMode) {
        this.streamSettingsService.setSettings({
          key: data.streamKey,
          platform: 'flextv',
          streamType: 'rtmp_common',
          server: data.url,
        });
      }
    }
    if (goLiveSettings) {
      const streamConfigs = goLiveSettings?.platforms.flextv;
      if (!streamConfigs) return;
      const { title, theme, resolution, minRatingLevel, password, isForAdult } = streamConfigs;

      await platformAuthorizedRequest<{ url: string; streamKey: string }>('flextv', {
        url: `${this.apiBase}/api/m/channel/config`,
        method: 'PUT',
        body: JSON.stringify({
          title,
          theme,
          resolution,
          minRatingLevel,
          password,
          isForAdult,
        }),
      });
      this.state.settings = {
        title,
        theme,
        resolution,
        minRatingLevel,
        password,
        isForAdult,
      };
    }
  }

  async afterGoLive() {
    if (!this.state.settings) {
      await remote.dialog.showMessageBox({
        type: 'error',
        message: '방송 설정이 없습니다.',
        title: '송출 오류',
      });
      return;
    }
    const { title, theme, resolution, minRatingLevel, password, isForAdult } = this.state.settings;
    await platformAuthorizedRequest<{ url: string; streamKey: string }>('flextv', {
      url: `${this.apiBase}/api/my/channel/start-stream`,
      method: 'POST',
      body: JSON.stringify({
        title,
        theme,
        resolution,
        minRatingLevel,
        userAgentType: 'PC_APP_V1',
        password,
        isForAdult,
      }),
    });
  }

  async afterStopStream() {
    await platformAuthorizedRequest<{ url: string; streamKey: string }>('flextv', {
      url: `${this.apiBase}/api/my/channel/stop-stream`,
      method: 'POST',
    });
  }

  private async fetchNewAccessToken(): Promise<string> {
    const url = `${BASE_URL}/api/oauth/refresh`;
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.userService.apiToken }),
    });
    return jfetch<{ access_token: string }>(request).then(response => {
      return response.access_token;
    });
  }

  async fetchNewToken(): Promise<void> {
    const accessToken = await this.fetchNewAccessToken();
    return this.userService.updatePlatformToken('flextv', accessToken);
  }

  fetchStreamPair(): Promise<{ url: string; streamKey: string }> {
    return platformAuthorizedRequest<{ url: string; streamKey: string }>(
      'flextv',
      `${this.apiBase}/api/my/channel/stream-key`,
    ).catch(() => ({ streamKey: null, url: null }));
  }

  registerNewStreamKey(): Promise<{ url: string; streamKey: string }> {
    const isSuccess = await platformAuthorizedRequest<boolean>(
      'flextv',
      `${this.apiBase}/api/my/chennel-register`,
    )
      .then(() => true)
      .catch(() => false);
    if (isSuccess) {
      return this.fetchStreamPair();
    }
    return { streamKey: null, url: null };
  }

  getHeaders(req: IPlatformRequest, useToken: boolean | string) {
    const token = typeof useToken === 'string' ? useToken : useToken && this.apiToken;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async validatePlatform() {
    return EPlatformCallResult.Success;
  }

  async initWidgets() {
    if (this.widgets?.length > 0) return;
    this.widgets = await platformAuthorizedRequest<IFlexTvWidget[]>(
      'flextv',
      `${this.apiBase}/api/my/channel/hp/widget-urls`,
    );
  }

  async fetchWidgets(type: string) {
    const widgets = await platformAuthorizedRequest<IFlexTvWidget[]>(
      'flextv',
      `${this.apiBase}/api/my/channel/hp/widget-urls`,
    );
    return widgets.filter(w => w.type === type);
  }

  getWidgetUrls(type: string): IFlexTvWidget[] {
    return this.widgets.filter(w => w.type === type);
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    const config = await platformAuthorizedRequest<{
      data: {
        channelId: number;
        themeId: number;
        title: string;
        resolution: number;
        isForAdult: number;
        password: string;
        minRatingLevel: number;
        maxViewerCount: number;
      };
    }>('flextv', `${this.apiBase}/api/m/channel/config`);
    this.SET_PREPOPULATED(true);
    this.SET_STREAM_SETTINGS({ ...config.data });
  }

  async fetchStreamConfig(): Promise<IFlextvStartStreamOptions> {
    const config = await platformAuthorizedRequest<{
      data: IFlextvStartStreamOptions,
    }>('flextv', `${this.apiBase}/api/m/channel/config`);
    return config.data;
  }

  async fetchThemes(): Promise<IFlexTvTheme[]> {
    return platformAuthorizedRequest<IFlexTvTheme[]>('flextv', `${this.apiBase}/api/guest/themes`);
  }

  async fetchUserInfo(): Promise<IUserInfo> {
    const userInfo = await platformAuthorizedRequest<{
      profile: {
        nickname: string;
        id: number;
        channelId: number;
      };
    }>('flextv', `${this.apiBase}/api/my/profile`).catch(() => null);
    if (!userInfo) return null;
    const token = await this.fetchNewAccessToken();
    if (!token) return null;
    return {
      id: String(userInfo.profile.id),
      username: userInfo.profile.nickname,
      channelId: String(userInfo.profile.channelId),
      token,
    };
  }

  async putChannelInfo(): Promise<void> {
    // no API
  }

  get chatUrl(): string {
    return `${this.apiBase}/redirects/signin?token=${this.apiToken}&redirectTo=/popup/chat/${this.channelId}?darkTheme=true`;
  }

  get helperUrl(): string {
    return `${HELPER_BASE_URL}/member/getlogin?branch=flex&authdata=`;
  }

  get liveDockEnabled(): boolean {
    return false;
  }

  async checkReadyToStream(): Promise<IFlexTvCommonResponse> {
    const resp = await platformAuthorizedRequest<any>(
      'flextv',
      `${this.apiBase}/api/my/profile`,
    ).catch(error => {
      console.log('error', error);
      return null;
    });
    if (!resp.profile || !resp.profile.PI) {
      return {
        success: false,
        error: {
          code: 'NO_AUTH',
        },
      };
    }
    return {
      success: true,
    };
  }

  async fetchHelperToken(): Promise<string> {
    return platformAuthorizedRequest<string>(
      'flextv',
      `${this.apiBase}/api/my/channel/hp/access-key`,
    ).catch(() => '');
  }
}

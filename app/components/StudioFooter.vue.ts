import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from '../services/core/injector';
import { StreamingService, EReplayBufferState, EStreamingState } from '../services/streaming';
import {
  PerformanceMetrics,
  StartStreamingButton,
  TestWidgets,
  NotificationsArea,
} from 'components/shared/ReactComponentList';
import { UserService } from '../services/user';
import { getPlatformService } from 'services/platforms';
import { YoutubeService } from 'services/platforms/youtube';
import { FlexTvService } from 'services/platforms/flextv';
import { PerformanceService, EStreamQuality } from 'services/performance';
import { CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import { SettingsService } from 'services/settings';
import { UsageStatisticsService } from 'services/usage-statistics';
import { NavigationService } from '../services/navigation';
import * as remote from '@electron/remote';

@Component({
  components: {
    StartStreamingButton,
    TestWidgets,
    PerformanceMetrics,
    NotificationsArea,
  },
})
export default class StudioFooterComponent extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;
  @Inject() settingsService: SettingsService;
  @Inject() performanceService: PerformanceService;
  @Inject() youtubeService: YoutubeService;
  @Inject() flexTvService: FlexTvService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() navigationService: NavigationService;

  @Prop() locked: boolean;

  metricsShown = false;
  recordingTime = '';
  private recordingTimeIntervalId: number;

  mounted() {
    this.confirmYoutubeEnabled();

    // update recording time
    this.recordingTimeIntervalId = window.setInterval(() => {
      if (!this.streamingService.isRecording) return;
      this.recordingTime = this.streamingService.formattedDurationInCurrentRecordingState;
    }, 1000);
  }

  destroyed() {
    clearInterval(this.recordingTimeIntervalId);
  }

  toggleRecording() {
    this.streamingService.toggleRecording();
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  get performanceIconClassName() {
    if (!this.streamingStatus || this.streamingStatus === EStreamingState.Offline) {
      return '';
    }

    if (
      this.streamingStatus === EStreamingState.Reconnecting ||
      this.performanceService.views.streamQuality === EStreamQuality.POOR
    ) {
      return 'warning';
    }

    if (this.performanceService.views.streamQuality === EStreamQuality.FAIR) {
      return 'info';
    }

    return 'success';
  }

  get mediaBackupOptOut() {
    return this.customizationService.state.mediaBackupOptOut;
  }

  get recording() {
    return this.streamingService.isRecording;
  }

  get loggedIn() {
    return this.userService.isLoggedIn;
  }

  get canSchedule() {
    const streamingView = this.streamingService.views;
    return streamingView.supports('stream-schedule', streamingView.linkedPlatforms);
  }

  get youtubeEnabled() {
    if (this.userService.platform) {
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);
      if (service instanceof YoutubeService) {
        return service.state.liveStreamingEnabled;
      }
    }
    return true;
  }

  openYoutubeEnable() {
    this.youtubeService.actions.openYoutubeEnable();
  }

  openScheduleStream() {
    this.navigationService.navigate('StreamScheduler');
  }

  confirmYoutubeEnabled() {
    if (this.userService.platform) {
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);
      if (service instanceof YoutubeService) {
        service.prepopulateInfo();
      }
    }
  }

  openMetricsWindow() {
    this.windowsService.showWindow({
      componentName: 'AdvancedStatistics',
      title: $t('Performance Metrics'),
      size: { width: 700, height: 550 },
      resizable: true,
      maximizable: false,
      minWidth: 500,
      minHeight: 400,
    });
    this.usageStatisticsService.recordFeatureUsage('PerformanceStatistics');
  }

  get replayBufferEnabled() {
    return this.settingsService.views.values.Output.RecRB;
  }

  get replayBufferOffline() {
    return this.streamingService.state.replayBufferStatus === EReplayBufferState.Offline;
  }

  get replayBufferStopping() {
    return this.streamingService.state.replayBufferStatus === EReplayBufferState.Stopping;
  }

  get replayBufferSaving() {
    return this.streamingService.state.replayBufferStatus === EReplayBufferState.Saving;
  }

  toggleReplayBuffer() {
    if (this.streamingService.state.replayBufferStatus === EReplayBufferState.Offline) {
      this.streamingService.startReplayBuffer();
    } else {
      this.streamingService.stopReplayBuffer();
    }
  }

  async openFlexTvHelperWindow() {
    return this.flexTvService
      .fetchHelperToken()
      .then(token => {
        const url = `${this.flexTvService.helperUrl}${encodeURIComponent(
          token,
        )}`;
        return remote.shell.openExternal(url);
      })
      .catch((e: unknown) => {
        return remote.dialog.showMessageBox({
          title: '위젯 설정 열기 실패',
          type: 'warning',
          message:
            '일시적인 문제가 발생하였습니다. 문제가 지속적으로 발생한다면 고객센터에 문의 부탁드립니다.',
        });
      });
  }

  openLoginWindow() {
    this.userService.showLogin();
  }

  saveReplay() {
    this.streamingService.saveReplay();
  }
}

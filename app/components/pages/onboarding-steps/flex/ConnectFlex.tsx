import { Component } from 'vue-property-decorator';
import * as remote from '@electron/remote';
import { EAuthProcessState, UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { OnboardingService } from 'services/onboarding';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';

import FlexLoginForm from './FlexLoginForm';
import { UsageStatisticsService } from 'services/usage-statistics';
import { FlexTvService } from 'services/platforms/flextv';
import { StreamingService } from '../../../../services/streaming';
import { IncrementalRolloutService } from '../../../../services/incremental-rollout';

class ConnectProps {
  continue: () => void = () => {};
}

@Component({ props: createProps(ConnectProps) })
export default class ConnectFlex extends TsxComponent<ConnectProps> {
  @Inject() userService: UserService;
  @Inject() onboardingService: OnboardingService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() streamingService!: StreamingService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;
  @Inject() flexTvService: FlexTvService;

  get loading() {
    return this.userService.state.authProcessState === EAuthProcessState.Loading;
  }

  get isRelog() {
    return this.userService.state.isRelog;
  }

  render() {
    return <FlexLoginForm continue={this.props.continue} />;
  }
}

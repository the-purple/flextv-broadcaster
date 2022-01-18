import { GenericGoalService } from '../generic-goal';
import { WIDGET_INITIAL_STATE } from '../widget-settings';
import { WidgetType } from 'services/widgets';
import { InheritMutations } from 'services/core/stateful-service';

@InheritMutations()
export class FlexTVDonationGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.FlexGoal,
      url: '',
      previewUrl: '',
      dataFetchUrl: '',
      settingsSaveUrl: '',
      goalUrl: '',
      settingsUpdateEvent: 'donationGoalSettingsUpdate',
      goalCreateEvent: 'donationGoalStart',
      goalResetEvent: 'donationGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}

import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TransitionsService } from 'services/transitions';
import { WindowsService } from 'services/windows';
import ModalLayout from 'components/ModalLayout.vue';
import TransitionSettings from 'components/TransitionSettings.vue';
import Tabs, { ITab } from 'components/Tabs.vue';
import { ScenesService } from 'services/scenes';
import ConnectionSettings from 'components/ConnectionSettings';
import VModal from 'vue-js-modal';
import { EditorCommandsService } from 'services/editor-commands';
import Scrollable from 'components/shared/Scrollable';

Vue.use(VModal);

@Component({
  components: {
    ModalLayout,
    TransitionSettings,
    Tabs,
    ConnectionSettings,
    Scrollable,
  },
})
export default class FlexTvSceneTransitions extends Vue {
  @Inject() transitionsService: TransitionsService;
  @Inject() windowsService: WindowsService;
  @Inject() scenesService: ScenesService;
  @Inject() private editorCommandsService: EditorCommandsService;

  tabs: ITab[] = [
    {
      name: 'Transitions',
      value: 'transitions',
    },
    {
      name: 'Connections',
      value: 'connections',
    },
  ];

  lockStates: Dictionary<boolean>;

  /**
   * Scene transitions created from apps should not be editable
   * if the app developer specified `shouldLock` as part of their
   * scene transition creation options.
   *
   * @param id ID of the scene transition
   */
  isEditable(id: string) {
    if (!this.lockStates) {
      this.lockStates = this.transitionsService.getLockedStates();
    }

    return !this.lockStates[id];
  }

  // TRANSITIONS

  get transitions() {
    return this.transitionsService.state.transitions;
  }

  makeDefault(id: string) {
    this.editorCommandsService.executeCommand('SetDefaultTransitionCommand', id);
  }

  // CONNECTIONS

  get connections() {
    return this.transitionsService.state.connections;
  }

  done() {
    this.windowsService.closeChildWindow();
  }
}

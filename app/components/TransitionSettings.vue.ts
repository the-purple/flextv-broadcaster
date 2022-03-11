import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TransitionsService, ETransitionType, TRANSITION_DURATION_MAX } from 'services/transitions';
import * as inputComponents from 'components/obs/inputs';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { EditorCommandsService } from 'services/editor-commands';
import { debounce } from 'lodash-decorators';
import { Subscription } from 'rxjs';
import isEqual from 'lodash/isEqual';

@Component({
  components: {
    GenericForm,
    HFormGroup,
    ...inputComponents,
  },
})
export default class SceneTransitions extends Vue {
  @Inject() transitionsService!: TransitionsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  transitionId: string = '';
  propertiesChanged: Subscription;

  mounted() {
    this.transitionId = this.transitionsService.state.transitions[0].id;
    this.propertiesChanged = this.transitionsService.transitionPropertiesChanged.subscribe(id => {
      if (id === this.transitionId) {
        this.properties = this.transitionsService.getPropertiesFormData(this.transitionId);
      }
    });
  }

  get typeModel(): ETransitionType {
    return this.transitionsService.state.transitions[0].type;
  }

  set typeModel(value: ETransitionType) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
      type: value,
    });
  }

  get typeOptions() {
    return this.transitionsService.views.getTypes();
  }

  get durationModel(): number {
    return this.transitionsService.state.transitions[0].duration;
  }

  @debounce(500)
  set durationModel(value: number) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
      duration: Math.min(value, TRANSITION_DURATION_MAX),
    });
  }

  get nameModel(): string {
    return this.transitionsService.state.transitions[0].name;
  }

  @debounce(500)
  set nameModel(name: string) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, { name });
  }

  get transition() {
    return this.transitionsService.getTransition(this.transitionId);
  }

  properties = this.transitionsService.getPropertiesFormData(this.transitionId);

  saveProperties(props: TObsFormData) {
    if (isEqual(this.properties, props)) return;

    this.properties = props;
    this.debouncedSaveProperties(props);
  }

  @debounce(500)
  debouncedSaveProperties(props: TObsFormData) {
    this.editorCommandsService.executeCommand('EditTransitionCommand', this.transitionId, {
      formData: props,
    });
  }
}

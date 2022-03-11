import { Component, Watch } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import styles from './BaseElement.m.less';
import Scrollable from 'components/shared/Scrollable';

@Component({})
export default class BaseElement extends TsxComponent {
  mins = { x: 0, y: 0 };
  interval: number;
  height = 0;
  width = 0;
  sizeWatcher: Function;

  static sizeWatcherId: number;
  static sizeWatcherCallbacks: Function[] = [];
  static addSizeWatcher(cb: Function) {
    this.sizeWatcherCallbacks.push(cb);
    if (this.sizeWatcherId) return;
    this.sizeWatcherId = window.setInterval(() => {
      this.sizeWatcherCallbacks.forEach(cb => cb());
    }, 500);
  }
  static removeSizeWatcher(watcherFunc: Function) {
    const ind = this.sizeWatcherCallbacks.findIndex(cb => cb === watcherFunc);
    if (ind !== -1) this.sizeWatcherCallbacks.splice(ind, 1);
  }

  mounted() {
    this.sizeWatcher = () => {
      if (!this.$el?.getBoundingClientRect) return;
      this.height = this.$el.getBoundingClientRect().height;
      this.width = this.$el.getBoundingClientRect().width;
    };
    this.sizeWatcher();
    BaseElement.addSizeWatcher(this.sizeWatcher);
  }

  destroyed() {
    BaseElement.removeSizeWatcher(this.sizeWatcher);
  }

  get element() {
    return <div />;
  }

  renderElement() {
    return this.element;
  }
}

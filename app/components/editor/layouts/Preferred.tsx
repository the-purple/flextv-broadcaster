import cx from 'classnames';
import BaseLayout, { LayoutProps, ILayoutSlotArray } from './BaseLayout';
import { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import ResizeBar from 'components/shared/ResizeBar.vue';
import styles from './Layouts.m.less';

@Component({ props: createProps(LayoutProps) })
export default class Preferred extends BaseLayout {
  isColumns = true;

  async mounted() {
    this.mountResize();
    this.$emit('totalWidth', await this.mapVectors([['1', ['3', '4', '5']], '2']), this.isColumns);
    this.setMins(['1', ['3', '4', '5']], ['2']);
  }
  destroyed() {
    this.destroyResize();
  }

  get vectors() {
    return [['1', ['3', '4', '5']], '2'] as ILayoutSlotArray;
  }

  render() {
    return (
      <div class={cx(styles.columns)}>
        <div
          class={styles.rows}
          style={{
            width: this.customizationService.state.showChatBox ? 'calc(100% - 400px)' : '100%',
          }}
        >
          <div class={styles.cell} style={{ height: `${100 - this.resizes.bar1 * 100}%` }}>
            {this.$slots['1']}
          </div>
          <ResizeBar
            position="top"
            value={this.bar1}
            onInput={(value: number) => this.setBar('bar1', value)}
            onResizestart={() => this.resizeStartHandler()}
            onResizestop={() => this.resizeStopHandler()}
            max={this.calculateMax(this.mins.rest)}
            min={0.1}
            reverse={true}
          />
          <div
            class={styles.segmented}
            style={{ height: `${this.resizes.bar1 * 100}%`, padding: '0 8px' }}
          >
            <div class={styles.cell}>{this.$slots['3']}</div>
            <div class={cx(styles.cell, styles.fixed)} style={{ width: '350px' }}>
              {this.$slots['4']}
            </div>
            <div class={cx(styles.cell, styles.fixed)} style={{ width: '280px' }}>
              {this.$slots['5']}
            </div>
          </div>
        </div>
        {this.customizationService.state.showChatBox ? (
          <div style={{ width: '400px' }} class={styles.cell}>
            {this.$slots['2']}
          </div>
        ) : null}
      </div>
    );
  }
}

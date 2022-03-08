import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';
import { BrowserView } from 'components/shared/ReactComponentList';
import { Inject } from 'services/core';
import Scrollable from 'components/shared/Scrollable';
import styles from './BaseElement.m.less';
import { StreamingService } from '../../../services/streaming';
import { UserService } from '../../../services/user';
import * as remote from '@electron/remote';

@Component({})
export default class FlexTvChat extends BaseElement {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;

  view: Electron.BrowserView = null;
  windowOpened: boolean = false;

  openChatWindow() {
    const chatWindow = new remote.BrowserWindow({
      width: 600,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
      },
    });
    chatWindow.once('close', () => {
      this.windowOpened = false;
    });
    chatWindow.setMenu(null);
    chatWindow.loadURL(this.url);
    this.windowOpened = true;
  }

  get url() {
    return this.streamingService.views.chatUrl;
  }

  get element() {
    const isInLive = this.streamingService.isStreaming || this.streamingService.isPaused;
    return (
      <div>
        <div class="studio-controls-top">
          <h2 class="studio-controls__label">채팅</h2>
          {isInLive ? (
            <div>
              {!this.windowOpened ? (
                <i class={cx('icon-button', styles.iconOpenLink)} onClick={this.openChatWindow} />
              ) : null}
              <i
                class="icon-repeat icon-button"
                onClick={() => {
                  if (!this.view) return;
                  this.view.webContents.reload();
                }}
              />
            </div>
          ) : null}
        </div>
        <Scrollable className="studio-controls-selector">
          {this.userService.isLoggedIn && isInLive ? (
            <div style="height: 100%;">
              <BrowserView
                componentProps={{
                  class: styles.container,
                  src: this.url,
                  options: { webPreferences: { contextIsolation: true } },
                  onReady: (view: Electron.BrowserView) => {
                    this.view = view;
                  },
                }}
              />
            </div>
          ) : (
            <div style="height: 100%; background-color: #252525;" />
          )}
        </Scrollable>
      </div>
    );
  }

  render() {
    return this.renderElement();
  }
}

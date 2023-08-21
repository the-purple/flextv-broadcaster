import React, { useRef, useState } from 'react';
import styles from './BaseElement.m.less';
import { Services } from 'components-react/service-provider';
import useBaseElement from './hooks';
import { useVuex } from 'components-react/hooks';
import BrowserView from 'components-react/shared/BrowserView';
import cx from 'classnames';
import * as remote from '@electron/remote';

export default function StreamPreview() {
  const viewRef = useRef<Electron.BrowserView>(null);
  const [windowOpened, setWindowOpened] = useState(false);
  const { StreamingService, UserService, FlexTvService } = Services;

  const containerRef = useRef<HTMLDivElement>(null);

  const { renderElement } = useBaseElement(
    <FlexTvChatElement />,
    {
      x: 0,
      y: 0,
    },
    containerRef.current,
  );

  const { isLoggedIn, isStreaming, isPaused, chatUrl } = useVuex(
    () => ({
      isLoggedIn: UserService.views.isLoggedIn,
      isStreaming: StreamingService.views.isStreaming,
      isPaused: StreamingService.views.isPaused,
      chatUrl: StreamingService.views.chatUrl,
    }),
    false,
  );

  function openChatWindow() {
    const chatWindow = new remote.BrowserWindow({
      width: 600,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
      },
    });
    chatWindow.once('close', () => {
      setWindowOpened(false);
    });
    chatWindow.setMenu(null);
    chatWindow.loadURL(chatUrl);
    setWindowOpened(true);
  }

  async function handleReload() {
    await FlexTvService.actions.fetchNewToken();

    return viewRef.current?.webContents.loadURL(chatUrl);
  }

  function FlexTvChatElement() {
    const isInLive = isPaused || isStreaming;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="studio-controls-top">
          <h2 className="studio-controls__label">채팅</h2>
          {isInLive ? (
            <div>
              {!windowOpened ? (
                <i
                  className={cx('icon-button', styles.iconOpenLink)}
                  onClick={openChatWindow}
                />
              ) : null}
              <i
                className="icon-repeat icon-button"
                onClick={handleReload}
              />
            </div>
          ) : null}
        </div>
        {isLoggedIn && isInLive ? (
          <div style={{ height: '100%' }}>
            <BrowserView
              className={styles.container}
              src={chatUrl}
              options={{ webPreferences: { contextIsolation: true } }}
              onReady={(view: Electron.BrowserView) => {
                // @ts-ignore
                viewRef.current = view;
              }}
            />
          </div>
        ) : (
          <div
            style={{
              height: '100%',
              backgroundColor: '#252525',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            실시간 채팅은 라이브중에 노출됩니다.
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );
}

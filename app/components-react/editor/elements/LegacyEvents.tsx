import electron from 'electron';
import * as remote from '@electron/remote';
import React, { useRef } from 'react';
import { $t } from 'services/i18n';
import useBaseElement from './hooks';
import { Services } from 'components-react/service-provider';
import BrowserView from 'components-react/shared/BrowserView';
import styles from './RecentEvents.m.less';

export default function LegacyEvents(p: { onPopout: () => void }) {
  const { UserService, RecentEventsService, MagicLinkService } = Services;

  const containerRef = useRef<HTMLDivElement>(null);
  const magicLinkDisabled = useRef(false);

  function popoutRecentEvents() {
    p.onPopout();
    return RecentEventsService.openRecentEventsWindow();
  }

  function handleBrowserViewReady(view: Electron.BrowserView) {
    view.webContents.setWindowOpenHandler(details => {
      const match = details.url.match(/dashboard\/([^\/^\?]*)/);

      if (match && match[1] === 'recent-events') {
        popoutRecentEvents();
      } else if (match) {
        // Prevent spamming our API
        if (magicLinkDisabled.current) return { action: 'deny' };
        magicLinkDisabled.current = true;

        MagicLinkService.actions.return
          .getDashboardMagicLink(match[1])
          .then(link => {
            remote.shell.openExternal(link);
          })
          .catch(e => {
            console.error('Error generating dashboard magic link', e);
          });

        magicLinkDisabled.current = false;
      } else {
        remote.shell.openExternal(details.url);
      }

      return { action: 'deny' };
    });
  }

  const { renderElement } = useBaseElement(<Element />, { x: 0, y: 0 }, containerRef.current);

  function Element() {
    if (!UserService.isLoggedIn) {
      return (
        <div className={styles.eventContainer}>
          <div className={styles.empty}>{$t('There are no events to display')}</div>
        </div>
      );
    }

    return (
      <div style={{ height: '100%' }}>
        <BrowserView
          className={styles.eventContainer}
          src={UserService.recentEventsUrl()}
          setLocale={true}
          onReady={(view: Electron.BrowserView) => handleBrowserViewReady(view)}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );
}

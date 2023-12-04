import React, { useLayoutEffect, useRef } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import cx from 'classnames';
import { EDismissable } from 'services/dismissables';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import NavTools from './FlexTvNavTools';
import styles from './SideNav.m.less';
import { Layout, Menu } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import HelpTip from 'components-react/shared/HelpTip';
import NewBadge from 'components-react/shared/NewBadge';
import { ENavName } from '../../services/side-nav';

const { Sider } = Layout;

export default function SideNav() {
  const { CustomizationService, SideNavService, WindowsService, DismissablesService } = Services;

  const {
    currentMenuItem,
    setCurrentMenuItem,
    leftDock,
    isOpen,
    updateStyleBlockers,
    dismiss,
    showNewBadge,
  } = useVuex(() => ({
    currentMenuItem: SideNavService.views.currentMenuItem,
    setCurrentMenuItem: SideNavService.actions.setCurrentMenuItem,
    leftDock: CustomizationService.state.leftDock,
    isOpen: SideNavService.views.isOpen,
    updateStyleBlockers: WindowsService.actions.updateStyleBlockers,
    dismiss: DismissablesService.actions.dismiss,
    showNewBadge:
      DismissablesService.views.shouldShow(EDismissable.NewSideNav) &&
      SideNavService.views.hasLegacyMenu,
  }));

  const sider = useRef<HTMLDivElement | null>(null);

  const siderMinWidth: number = 50;
  const siderMaxWidth: number = 200;

  const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    entries.forEach((entry: ResizeObserverEntry) => {
      const width = Math.floor(entry?.contentRect?.width);

      if (width === siderMinWidth || width === siderMaxWidth) {
        updateStyleBlockers('main', false);
      }
    });
  });

  useLayoutEffect(() => {
    if (sider && sider?.current) {
      resizeObserver.observe(sider?.current);
    }
  }, [sider]);

  return (
    <Layout hasSider className="side-nav">
      <Sider
        collapsible
        collapsed={true}
        trigger={null}
        className={cx(
          styles.sidenavSider,
          styles.siderClosed,
          !leftDock && styles.noLeftDock,
        )}
        ref={sider}
      >
        <Scrollable className={cx(styles.sidenavScroll)}>
          <Menu
            key={ENavName.TopNav}
            forceSubMenuRender
            mode="inline"
            className={cx(
              styles.topNav,
              isOpen && styles.open,
              !isOpen && styles.siderClosed && styles.closed,
            )}
          />
          <NavTools />
        </Scrollable>

        <LoginHelpTip />
      </Sider>
      <NewBadge
        dismissableKey={EDismissable.NewSideNav}
        size="small"
        absolute
        style={{ left: 'calc(100% / 20px)', top: 'calc(100% / 2)' }}
      />
    </Layout>
  );
}

function LoginHelpTip() {
  return (
    <HelpTip
      title={$t('Login')}
      dismissableKey={EDismissable.LoginPrompt}
      position={{ top: 'calc(100vh - 175px)', left: '80px' }}
      arrowPosition="bottom"
      style={{ position: 'absolute' }}
    >
      <div>
        {$t(
          'Gain access to additional features by logging in with your preferred streaming platform.',
        )}
      </div>
    </HelpTip>
  );
}

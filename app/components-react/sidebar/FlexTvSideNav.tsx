import React, { useState } from 'react';
import Animation from 'rc-animate';
import cx from 'classnames';
import { TAppPage } from 'services/navigation';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { $t } from 'services/i18n';
import { getPlatformService } from 'services/platforms';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import AppsNav from './AppsNav';
import FlexTvNavTools from './FlexTvNavTools';
import styles from './SideNav.m.less';

interface IPageData {
  target: TAppPage;
  icon?: string;
  svgIcon?: JSX.Element;
  title: string;
  trackingTarget: string;
  newBadge?: boolean;
}

export default function FlexTvSideNav() {
  const {
    AppService,
    CustomizationService,
    NavigationService,
    UserService,
    PlatformAppsService,
    IncrementalRolloutService,
    UsageStatisticsService,
  } = Services;

  function navigate(page: TAppPage, trackingTarget?: string) {
    if (!UserService.views.isLoggedIn && page !== 'Studio') return;

    if (trackingTarget) {
      UsageStatisticsService.actions.recordClick('SideNav', trackingTarget);
    }
    NavigationService.actions.navigate(page);
  }

  const {
    featureIsEnabled,
    appStoreVisible,
    currentPage,
    leftDock,
    enabledApps,
    loggedIn,
  } = useVuex(() => ({
    featureIsEnabled: (feature: EAvailableFeatures) =>
      IncrementalRolloutService.views.featureIsEnabled(feature),
    currentPage: NavigationService.state.currentPage,
    leftDock: CustomizationService.state.leftDock,
    appStoreVisible: UserService.views.isLoggedIn && PlatformAppsService.state.storeVisible,
    loading: AppService.state.loading,
    enabledApps: PlatformAppsService.views.enabledApps,
    loggedIn: UserService.views.isLoggedIn,
  }));

  const pageData: IPageData[] = [];
  const hasThemes =
    loggedIn &&
    UserService.views.platform?.type &&
    getPlatformService(UserService.views.platform.type).hasCapability('themes');

  if (hasThemes) {
    pageData.push({
      target: 'BrowseOverlays',
      icon: 'icon-themes',
      title: $t('Themes'),
      trackingTarget: 'themes',
    });
  }

  return (
    <div className={cx('side-nav', styles.container, { [styles.leftDock]: leftDock })}>
      <PrimaryStudioTab currentPage={currentPage} navigate={navigate} />
      {pageData.map(page => (
        <div
          key={page.target}
          className={cx(styles.mainCell, {
            [styles.active]: currentPage === page.target,
            [styles.disabled]: !loggedIn && page.target !== 'Studio',
          })}
          onClick={() => navigate(page.target as TAppPage, page.trackingTarget)}
          title={page.title}
        >
          {!!page.icon && <i className={page.icon} />}
          {!!page.svgIcon && page.svgIcon}
          {page.newBadge && <div className={cx(styles.badge, styles.newBadge)}>{$t('New')}</div>}
        </div>
      ))}
      {enabledApps.length > 0 && <AppsNav />}
      <FlexTvNavTools />
    </div>
  );
}

function PrimaryStudioTab(p: { currentPage: string; navigate: (page: TAppPage) => void }) {
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const { LayoutService } = Services;
  const { currentTab, tabs } = useVuex(() => ({
    currentTab: LayoutService.state.currentTab,
    tabs: LayoutService.state.tabs,
  }));

  const studioTabs = Object.keys(tabs).map((tab, i) => ({
    target: tab,
    title: i === 0 || !tabs[tab].name ? $t('Editor') : tabs[tab].name,
    icon: tabs[tab].icon,
    trackingTarget: tab === 'default' ? 'editor' : 'custom',
  }));

  return (
    <div
      onMouseEnter={() => setShowTabDropdown(true)}
      onMouseLeave={() => setShowTabDropdown(false)}
    >
      <div
        className={cx(styles.primaryTab, {
          [styles.active]: p.currentPage === 'Studio' && currentTab === 'default',
        })}
      >
        <StudioTab page={studioTabs[0]} navigate={p.navigate} />
        {studioTabs.length > 1 && (
          <i
            className={cx('icon-down', styles.studioDropdown, {
              [styles.studioDropdownActive]: currentTab !== 'default',
            })}
          />
        )}
      </div>
      <Animation transitionName="ant-slide-up">
        {showTabDropdown && (
          <div className={styles.studioTabs}>
            {studioTabs.slice(1).map(page => (
              <StudioTab page={page} navigate={p.navigate} key={page.target} />
            ))}
          </div>
        )}
      </Animation>
    </div>
  );
}

function StudioTab(p: {
  page: { target: string; title: string; icon: string; trackingTarget: string };
  navigate: (page: TAppPage, trackingTarget?: string) => void;
}) {
  const { LayoutService, NavigationService } = Services;
  const { currentPage } = useVuex(() => ({
    currentPage: NavigationService.state.currentPage,
  }));

  function navigateToStudioTab(tabId: string, trackingTarget: string) {
    p.navigate('Studio', trackingTarget);
    LayoutService.actions.setCurrentTab(tabId);
  }

  return (
    <div
      className={cx(styles.mainCell, {
        [styles.active]:
          currentPage === 'Studio' && LayoutService.state.currentTab === p.page.target,
      })}
      onClick={() => navigateToStudioTab(p.page.target, p.page.trackingTarget)}
      title={p.page.title}
    >
      <i className={p.page.icon} />
    </div>
  );
}


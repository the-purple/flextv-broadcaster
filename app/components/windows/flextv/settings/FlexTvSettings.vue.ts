import electron from 'electron';
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import NavItem from 'components/shared/NavItem.vue';
import GenericFormGroups from 'components/obs/inputs/GenericFormGroups.vue';
import { WindowsService } from 'services/windows';
import { ISettingsSubCategory, SettingsService } from 'services/settings';
import DeveloperSettings from 'components/windows/settings/DeveloperSettings';
import InstalledApps from 'components/InstalledApps.vue';
import Hotkeys from 'components/windows/settings/Hotkeys.vue';
import OverlaySettings from 'components/windows/settings/OverlaySettings';
import NotificationsSettings from 'components/windows/settings/NotificationsSettings.vue';
import ExperimentalSettings from 'components/windows/settings/ExperimentalSettings.vue';
import RemoteControlSettings from 'components/windows/settings/RemoteControlSettings.vue';
import GameOverlaySettings from 'components/windows/settings/GameOverlaySettings';
import SearchablePages from 'components/shared/SearchablePages';
import FormInput from 'components/shared/inputs/FormInput.vue';
import StreamSettings from 'components/windows/settings/StreamSettings';
import VirtualWebcamSettings from 'components/windows/settings/VirtualWebcamSettings';
import { MagicLinkService } from 'services/magic-link';
import { UserService } from 'services/user';
import Scrollable from 'components/shared/Scrollable';
import { ObsSettings, PlatformLogo } from 'components/shared/ReactComponentList';
import { $t } from 'services/i18n';
import { debounce } from 'lodash-decorators';

@Component({
  components: {
    ModalLayout,
    SearchablePages,
    GenericFormGroups,
    NavMenu,
    NavItem,
    Hotkeys,
    DeveloperSettings,
    OverlaySettings,
    NotificationsSettings,
    RemoteControlSettings,
    ExperimentalSettings,
    InstalledApps,
    GameOverlaySettings,
    FormInput,
    StreamSettings,
    VirtualWebcamSettings,
    Scrollable,
    PlatformLogo,
    ObsSettings,
  },
})
export default class FlexTvSettings extends Vue {
  @Inject() settingsService: SettingsService;
  @Inject() windowsService: WindowsService;
  @Inject() magicLinkService: MagicLinkService;
  @Inject() userService: UserService;

  $refs: { settingsContainer: HTMLElement & SearchablePages };

  searchStr = '';
  searchResultPages: string[] = [];
  icons: Dictionary<string> = {
    General: 'icon-overview',
    Stream: 'fas fa-globe',
    Output: 'fas fa-microchip',
    Video: 'fas fa-film',
    Audio: 'icon-audio',
    Hotkeys: 'icon-settings',
    'Game Overlay': 'icon-full-screen',
    'Virtual Webcam': 'fas fa-camera',
    Advanced: 'fas fa-cogs',
    Developer: 'far fa-file-code',
    'Scene Collections': 'icon-themes',
    Notifications: 'icon-notifications',
    Appearance: 'icon-settings-3-1',
    'Face Masks': 'icon-face-masks-3',
    'Remote Control': 'fas fa-play-circle',
    Experimental: 'fas fa-flask',
    'Installed Apps': 'icon-store',
  };

  internalCategoryName: string = null;

  created() {
    // Make sure we have the latest settings
    // FlexTV default settings
    this.settingsService.setSettingValue(
      'Output',
      'x264opts',
      '8x8dct=1 aq-mode=2 b-adapt=2 bframes=3 direct=auto keyint=150 me=umh merange=24 min-keyint=auto mixed-refs=1 partitions=i4 x4,p8x8,b8x8 profile=main rc-lookahead=60 ref=3 scenecut=40 subme=7 threads=0 trellis=1 weightb=1 weightp=2 ratetol=0.1 debloc k=1:0 qcomp=0.1 qpmax=69 qpmin=3 qpstep=4 vbv-bufsize=2000 vbv-maxrate=1800',
    );
    this.settingsService.setSettingValue('Video', 'FPSCommon', '29.97');
    this.settingsService.actions.loadSettingsIntoStore();
  }

  /**
   * Whether we have built a cache of searchable pages already.
   * If we havne't - we should debounce the user input.
   * If we have - no need to debounce and we should preserve a snappy experience
   */
  scanningDone = false;

  get categoryName() {
    if (this.internalCategoryName == null) {
      this.internalCategoryName = this.getInitialCategoryName();
    }

    return this.internalCategoryName;
  }

  get settingsData() {
    return this.settingsService.state[this.categoryName]?.formData ?? [];
  }

  set categoryName(val: string) {
    if (val === 'Prime') {
      this.magicLinkService.actions.linkToPrime('slobs-settings');
    } else {
      this.internalCategoryName = val;
    }
  }

  get isPrime() {
    return this.userService.views.isPrime;
  }

  get isLoggedIn() {
    return this.userService.views.isLoggedIn;
  }

  /**
   * returns the list of the pages ported to React
   */
  get reactPages() {
    return ['General', 'Appearance'];
  }

  get shouldShowReactPage() {
    return this.reactPages.includes(this.categoryName);
  }

  get shouldShowVuePage() {
    if (this.reactPages.includes(this.categoryName)) return false;
    return ![
      'Hotkeys',
      'Stream',
      'API',
      'Overlays',
      'Notifications',
      'Appearance',
      'Experimental',
      'Remote Control',
      'Installed Apps',
      'Virtual Webcam',
      'Developer',
    ].includes(this.categoryName);
  }

  getInitialCategoryName() {
    if (this.windowsService.state.child.queryParams) {
      return this.windowsService.state.child.queryParams.categoryName || 'General';
    }
    return 'General';
  }

  get categoryNames() {
    return this.settingsService
      .getCategories()
      .filter(category =>
        ['General', 'Stream', 'Output', 'Audio', 'Video', 'Advanced'].includes(category),
      );
  }

  save(settingsData: ISettingsSubCategory[]) {
    this.settingsService.setSettings(this.categoryName, settingsData);
  }

  done() {
    this.windowsService.closeChildWindow();
  }

  @Watch('categoryName')
  onCategoryNameChangedHandler(categoryName: string) {
    this.$refs.settingsContainer.scrollTop = 0;
  }

  originalCategory: string = null;

  onBeforePageScanHandler(page: string) {
    if (this.originalCategory == null) {
      this.originalCategory = this.categoryName;
    }

    this.categoryName = page;
  }

  onScanCompletedHandler() {
    this.scanningDone = true;
    this.categoryName = this.originalCategory;
    this.originalCategory = null;
  }

  onPageRenderHandler(page: string) {
    // hotkeys.vue has a delayed rendering, we have to wait before scanning
    if (page === 'Hotkeys') return new Promise(r => setTimeout(r, 500));
  }

  onSearchCompletedHandler(foundPages: string[]) {
    this.searchResultPages = foundPages;
    // if there are not search results for the current page than switch to the first found page
    if (foundPages.length && !foundPages.includes(this.categoryName)) {
      this.categoryName = foundPages[0];
    }
  }

  onSearchInput(str: string) {
    if (this.scanningDone) {
      this.searchStr = str;
    } else {
      this.debouncedSearchInput(str);
    }
  }

  @debounce(300)
  debouncedSearchInput(str: string) {
    this.searchStr = str;
  }

  highlightSearch(searchStr: string) {
    this.$refs.settingsContainer.highlightPage(searchStr);
  }

  handleAuth() {
    if (this.userService.isLoggedIn) {
      electron.remote.dialog
        .showMessageBox({
          title: $t('Confirm'),
          message: $t('Are you sure you want to log out?'),
          buttons: [$t('Yes'), $t('No')],
        })
        .then(({ response }) => {
          if (response === 0) {
            this.userService.logOut();
          }
        });
    } else {
      this.windowsService.closeChildWindow();
      this.userService.showLogin();
    }
  }
}

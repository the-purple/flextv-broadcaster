import NameFolder from './windows/NameFolder';
import NameScene from './windows/NameScene';
import GoLiveWindow from './windows/go-live/GoLiveWindow';
import FlexTvGoLiveWindow from './windows/flextv/FlexTvGoLiveWindow';
import EditStreamWindow from './windows/go-live/EditStreamWindow';
import IconLibraryProperties from './windows/IconLibraryProperties';
import ScreenCaptureProperties from './windows/ScreenCaptureProperties';
import GuestCamProperties from './windows/GuestCamProperties';
import News from './windows/notifications/News';
import PerformanceMetrics from './shared/PerformanceMetrics';
import PatchNotes from './pages/PatchNotes';
import Display from './shared/Display';
import TitleBar from './shared/TitleBar';
import Chat from './root/Chat';
import Highlighter from './pages/Highlighter';
import Grow from './pages/grow/Grow';
import Loader from './pages/Loader';
import NavTools from './sidebar/NavTools';
import FlexTvNavTools from './sidebar/FlexTvNavTools';
import PlatformLogo from './shared/PlatformLogo';
import Onboarding from './pages/onboarding/Onboarding';
import FlexLoginForm from './pages/onboarding/flex/FlexLoginForm';
import AdvancedStatistics from './windows/AdvancedStatistics';
import StudioFooter from './root/StudioFooter';
import StreamScheduler from './pages/stream-scheduler/StreamScheduler';
import { createRoot } from './root/ReactRoot';
import StartStreamingButton from './root/StartStreamingButton';
import SourceProperties from './windows/SourceProperties';
import TestWidgets from './root/TestWidgets';
import RenameSource from './windows/RenameSource';
import NotificationsArea from './root/NotificationsArea';
import StudioEditor from './root/StudioEditor';
import SharedComponentsLibrary from './windows/sharedComponentsLibrary/SharedComponentsLibrary';
import { ObsSettings } from './windows/settings/ObsSettings';
import ManageSceneCollections from './windows/ManageSceneCollections';
import ThemeAudit from './pages/ThemeAudit';
import { WidgetWindow } from './widgets/common/WidgetWindow';
import SafeMode from './windows/SafeMode';
import AdvancedAudio from './windows/advanced-audio';
import { CustomCodeWindow } from './widgets/common/CustomCode';
import SourceShowcase from './windows/source-showcase';
import SourceFilters from './windows/SourceFilters';
import RecentEvents from './editor/elements/RecentEvents';
import MiniFeed from './editor/elements/Minifeed';
import RecordingPreview from './editor/elements/RecordingPreview';
import StreamPreview from './editor/elements/StreamPreview';
import FlexTvChat from './editor/elements/FlexTvChat';
import BrowserView from './shared/BrowserView';
import LegacyEvents from './editor/elements/LegacyEvents';
import Browser from './editor/elements/Browser';
import DisplayElement from './editor/elements/Display';
import MediaGallery from './windows/MediaGallery';
import LayoutEditor from './pages/layout-editor/LayoutEditor';
import Projector from './windows/Projector';
import SceneSelector from './editor/elements/SceneSelector';
import AddSource from './windows/AddSource';
import SourceSelector from './editor/elements/SourceSelector';
import SideNav from './sidebar/SideNav';
import FlexTvSideNav from './sidebar/FlexTvSideNav';
import WelcomeToPrime from './windows/WelcomeToPrime';
import Notifications from './windows/notifications/Notifications';
import NotificationsAndNews from './windows/notifications';
import Blank from './windows/Blank';
import PlatformMerge from './pages/PlatformMerge';
import AlertboxLibrary from './pages/AlertboxLibrary';
import PlatformAppStore from './pages/PlatformAppStore';
import BrowseOverlays from './pages/BrowseOverlays';
import PlatformAppMainPage from './pages/PlatformAppMainPage';
import PlatformAppPageView from './shared/PlatformAppPageView';
import PlatformAppPopOut from './windows/PlatformAppPopOut';
import RecentEventsWindow from './windows/RecentEvents';
import NewBadge from './shared/NewBadge';
import RecordingHistory from './pages/RecordingHistory';
import UltraIcon from './shared/UltraIcon';
import EditTransform from './windows/EditTransform';
import InstalledApps from './windows/settings/InstalledApps';
import Hotkeys from './windows/settings/Hotkeys';
import GLVolmeters from './root/GLVolmeters';

// list of React components to be used inside Vue components
export const components = {
  AlertboxLibrary,
  BrowseOverlays,
  NameFolder,
  NameScene,
  BrowserView,
  GoLiveWindow: createRoot(GoLiveWindow),
  FlexTvGoLiveWindow: createRoot(FlexTvGoLiveWindow),
  EditStreamWindow: createRoot(EditStreamWindow),
  IconLibraryProperties,
  ScreenCaptureProperties,
  GuestCamProperties: createRoot(GuestCamProperties),
  News,
  PerformanceMetrics,
  ManageSceneCollections,
  PatchNotes,
  Display,
  TitleBar,
  Chat,
  Highlighter: createRoot(Highlighter),
  Grow,
  Loader,
  NavTools,
  FlexTvNavTools,
  PlatformLogo,
  Onboarding: createRoot(Onboarding),
  FlexLoginForm,
  Projector,
  StreamScheduler: createRoot(StreamScheduler),
  AdvancedStatistics,
  SourceProperties: createRoot(SourceProperties),
  SharedComponentsLibrary: createRoot(SharedComponentsLibrary),
  TestWidgets,
  RenameSource,
  StudioFooter: createRoot(StudioFooter),
  StartStreamingButton,
  NotificationsArea,
  ObsSettings: createRoot(ObsSettings),
  ThemeAudit,
  StudioEditor,
  WidgetWindow: createRoot(WidgetWindow),
  CustomCodeWindow: createRoot(CustomCodeWindow),
  SafeMode,
  AdvancedAudio: createRoot(AdvancedAudio),
  SourceShowcase: createRoot(SourceShowcase),
  SourceFilters,
  RecentEvents,
  MiniFeed: createRoot(MiniFeed),
  LegacyEvents: createRoot(LegacyEvents),
  Browser: createRoot(Browser),
  RecordingPreview: createRoot(RecordingPreview),
  StreamPreview: createRoot(StreamPreview),
  FlexTvChat: createRoot(FlexTvChat),
  DisplayElement: createRoot(DisplayElement),
  MediaGallery,
  LayoutEditor: createRoot(LayoutEditor),
  SceneSelector: createRoot(SceneSelector),
  AddSource,
  FlexTvSideNav,
  SourceSelector: createRoot(SourceSelector),
  RecordingHistory: createRoot(RecordingHistory),
  RecentEventsWindow,
  SideNav,
  WelcomeToPrime,
  Notifications,
  NotificationsAndNews,
  PlatformMerge,
  PlatformAppStore,
  PlatformAppMainPage,
  PlatformAppPageView,
  PlatformAppPopOut,
  NewBadge,
  UltraIcon,
  EditTransform,
  InstalledApps,
  Blank,
  Hotkeys,
  GLVolmeters: createRoot(GLVolmeters),
};

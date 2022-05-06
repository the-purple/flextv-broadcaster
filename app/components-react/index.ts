import NameFolder from './windows/NameFolder';
import NameScene from './windows/NameScene';
import GoLiveWindow from './windows/go-live/GoLiveWindow';
import FlexTvGoLiveWindow from './windows/flextv/FlexTvGoLiveWindow';
import EditStreamWindow from './windows/go-live/EditStreamWindow';
import IconLibraryProperties from './windows/IconLibraryProperties';
import ScreenCaptureProperties from './windows/ScreenCaptureProperties';
import News from './windows/News';
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
import ThemeAudit from './pages/ThemeAudit';
import { WidgetWindow } from './widgets/common/WidgetWindow';
import SafeMode from './windows/SafeMode';
import AdvancedAudio from './windows/advanced-audio';
import { CustomCodeWindow } from './widgets/common/CustomCode';
import SourceShowcase from './windows/source-showcase';
import SourceFilters from './windows/SourceFilters';
import RecentEvents from './editor/elements/RecentEvents';
import MiniFeed from './editor/elements/Minifeed';
import BrowserView from './shared/BrowserView';
import LegacyEvents from './editor/elements/LegacyEvents';
import MediaGallery from './windows/MediaGallery';
import LayoutEditor from './pages/layout-editor/LayoutEditor';
import Projector from './windows/Projector';
import SceneSelector from './editor/elements/SceneSelectorElement';
import AddSource from './windows/AddSource';
import SideNav from './sidebar/SideNav';
import FlexTvSideNav from './sidebar/FlexTvSideNav';
import AlertboxLibrary from './pages/AlertboxLibrary';

// list of React components to be used inside Vue components
export const components = {
  AlertboxLibrary,
  NameFolder,
  NameScene,
  BrowserView,
  GoLiveWindow: createRoot(GoLiveWindow),
  FlexTvGoLiveWindow: createRoot(FlexTvGoLiveWindow),
  EditStreamWindow: createRoot(EditStreamWindow),
  IconLibraryProperties,
  ScreenCaptureProperties,
  News,
  PerformanceMetrics,
  PatchNotes,
  Display,
  TitleBar,
  Chat,
  Highlighter,
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
  AdvancedAudio,
  SourceShowcase: createRoot(SourceShowcase),
  SourceFilters,
  RecentEvents,
  MiniFeed: createRoot(MiniFeed),
  LegacyEvents: createRoot(LegacyEvents),
  MediaGallery,
  LayoutEditor: createRoot(LayoutEditor),
  SceneSelector: createRoot(SceneSelector),
  AddSource,
  FlexTvSideNav,
  SideNav,
};

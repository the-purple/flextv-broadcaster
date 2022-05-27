import { Inject } from 'services/core/injector';
import { UserService } from '../user';
import { ScenesService, SceneItem, Scene } from '../scenes';
import { SourcesService } from '../sources';
import { VideoService } from '../video';
import { HostsService } from '../hosts';
import { FlexTvService } from '../platforms/flextv';
import { ScalableRectangle } from 'util/ScalableRectangle';
import namingHelpers from 'util/NamingHelpers';
import fs from 'fs';
import { ServicesManager } from 'services-manager';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { ISerializableWidget, IWidgetSource, IWidgetsServiceApi } from './widgets-api';
import { WidgetType, WidgetDefinitions, WidgetTesters } from './widgets-data';
import { FlexTvWidgetTypeKey } from './flextv-widgets-data';
import { mutation, StatefulService, ViewHandler } from '../core/stateful-service';
import { WidgetSource } from './widget-source';
import { InitAfter } from 'services/core/service-initialization-observer';
import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import { Subject, Subscription } from 'rxjs';
import { Throttle } from 'lodash-decorators';
import { EditorCommandsService } from 'services/editor-commands';
import { TWindowComponentName } from '../windows';
import { THttpMethod } from './settings/widget-settings';
import { TPlatform } from '../platforms';
import { getAlertsConfig, TAlertType } from './alerts-config';
import { getWidgetsConfig } from './widgets-config';
import { WidgetDisplayData } from './widgets-data';
import * as remote from '@electron/remote';
import Utils from '../utils';

export interface IWidgetSourcesState {
  widgetSources: Dictionary<IWidgetSource>;
}

class WidgetsServiceViews extends ViewHandler<IWidgetSourcesState> {
  get userService() {
    return this.getServiceViews(UserService);
  }

  // hack since in the current iteration HostsService cannot have views be fetched
  @Inject() hostsService: HostsService;

  get testers(): { name: string; url: string }[] {
    if (!this.userService.isLoggedIn) return;
    return WidgetTesters.filter(tester => {
      return tester.platforms.includes(this.userService.platform.type);
    }).map(tester => {
      return {
        name: tester.name,
        url: tester.url(this.hostsService.streamlabs, this.userService.platform.type),
      };
    });
  }
}

@InitAfter('SourcesService')
export class WidgetsService
  extends StatefulService<IWidgetSourcesState>
  implements IWidgetsServiceApi {
  static initialState: IWidgetSourcesState = {
    widgetSources: {},
  };

  @Inject() userService: UserService;
  @Inject() scenesService: ScenesService;
  @Inject() sourcesService: SourcesService;
  @Inject() hostsService: HostsService;
  @Inject() videoService: VideoService;
  @Inject() editorCommandsService: EditorCommandsService;
  @Inject() flexTvService: FlexTvService;

  protected init() {
    // sync widgetSources with sources

    this.sourcesService.sourceAdded.subscribe(sourceModel => {
      this.register(sourceModel.sourceId);
    });

    this.sourcesService.sourceUpdated.subscribe(sourceModel => {
      // sync widgets when propertiesManagerType has been changed
      if (
        sourceModel.propertiesManagerType === 'widget' &&
        !this.state.widgetSources[sourceModel.sourceId]
      ) {
        this.register(sourceModel.sourceId);
      } else if (
        sourceModel.propertiesManagerType !== 'widget' &&
        this.state.widgetSources[sourceModel.sourceId]
      ) {
        this.unregister(sourceModel.sourceId);
      }
    });

    this.sourcesService.sourceRemoved.subscribe(sourceModel => {
      if (!this.state.widgetSources[sourceModel.sourceId]) return;
      this.unregister(sourceModel.sourceId);
    });

    this.userService.userLogin.subscribe(async _ => {
      return this.flexTvService.initWidgets();
    });
  }

  get views() {
    return new WidgetsServiceViews(this.state);
  }

  async createWidget(type: WidgetType, name?: string): Promise<void> {
    if (!this.userService.isLoggedIn) return;
    const widgetTransform = this.widgetsConfig[type]?.defaultTransform || WidgetDefinitions[type];

    const suggestedName =
      name ||
      namingHelpers.suggestName(name || WidgetDisplayData()[type]?.name, (name: string) => {
        return this.sourcesService.views.getSourcesByName(name).length;
      });

    // Calculate initial position
    const rect = new ScalableRectangle({
      x: 0,
      y: 0,
      width: widgetTransform.width,
      height: widgetTransform.height,
    });

    rect.withAnchor(widgetTransform.anchor, () => {
      rect.x = widgetTransform.x * this.videoService.baseWidth;
      rect.y = widgetTransform.y * this.videoService.baseHeight;
    });

    let url = '';
    const widgets = await this.flexTvService.fetchWidgets(FlexTvWidgetTypeKey[type]);
    if (widgets.length > 1) {
      const selected = await remote.dialog.showMessageBox(Utils.getMainWindow(), {
        title: '두 개 이상의 프리셋이 있습니다.',
        type: 'info',
        message: '원하는 프리셋을 선택하세요.',
        buttons: widgets.map(w => w.name),
      });
      url = widgets[selected.response].url;
    } else if (widgets.length === 0) {
      await remote.dialog.showMessageBox(Utils.getMainWindow(), {
        title: `${WidgetDisplayData()[type]?.name} 위젯의 프리셋이 없습니다.`,
        type: 'warning',
        message: '하단의 위젯 설정에서 프리셋을 설정해 주세요.',
      });
      url = '';
    } else {
      url = widgets[0].url;
    }
    if (!url) return;

    await this.editorCommandsService.actions.return.executeCommand(
      'CreateNewItemCommand',
      this.scenesService.views.activeSceneId,
      suggestedName,
      'browser_source',
      {
        url,
        width: widgetTransform.width,
        height: widgetTransform.height,
      },
      {
        sourceAddOptions: {
          propertiesManager: 'widget',
          propertiesManagerSettings: {
            widgetType: type,
          },
        },
        initialTransform: {
          position: {
            x: rect.x,
            y: rect.y,
          },
        },
      },
    );
  }

  getWidgetSources(): WidgetSource[] {
    return Object.keys(this.state.widgetSources).map(id => this.getWidgetSource(id));
  }

  getWidgetSource(sourceId: string): WidgetSource {
    return this.state.widgetSources[sourceId] ? new WidgetSource(sourceId) : null;
  }

  async getWidgetUrl(type: WidgetType): Promise<string> {
    if (!this.userService.isLoggedIn || !WidgetDefinitions[type]) return '';
    await this.flexTvService.initWidgets();
    const widgets = this.flexTvService.getWidgetUrls(FlexTvWidgetTypeKey[type]);
    if (widgets.length === 0) {
      await remote.dialog.showMessageBox(Utils.getMainWindow(), {
        title: `${WidgetDisplayData()[type]?.name} 위젯의 프리셋이 없습니다.`,
        type: 'warning',
        message: '하단의 위젯 설정에서 프리셋을 설정해 주세요.',
      });
      return '';
    }
    if (widgets.length > 1) {
      const selected = await remote.dialog.showMessageBox(Utils.getMainWindow(), {
        title: '두 개 이상의 프리셋이 있습니다.',
        type: 'info',
        message: '원하는 프리셋을 선택하세요.',
        buttons: widgets.map(w => w.name),
      });
      return widgets[selected.response].url;
    }
    return widgets[0].url;
  }

  getWidgetComponent(type: WidgetType): TWindowComponentName {
    return WidgetType[type] as TWindowComponentName;
  }

  getWidgetSettingsService(type: WidgetType): any {
    const servicesManager: ServicesManager = ServicesManager.instance;
    const serviceName = `${this.getWidgetComponent(type)}Service`;
    return servicesManager.getResource(serviceName);
  }

  /**
   * @deprecated use .playAlert() instead
   */
  @Throttle(1000)
  test(testerName: string) {
    const tester = this.views.testers.find(tester => tester.name === testerName);
    const headers = authorizedHeaders(this.userService.apiToken);
    fetch(new Request(tester.url, { headers }));
  }

  @Throttle(1000)
  playAlert(alertType: TAlertType) {
    const config = this.alertsConfig[alertType];
    const headers = authorizedHeaders(this.userService.apiToken);
    fetch(new Request(config.url(), { headers }));
  }

  private previewSourceWatchers: Dictionary<Subscription> = {};

  /**
   * sync widget previewSource settings with widget source
   */
  syncPreviewSource(sourceId: string, previewSourceId: string) {
    if (this.previewSourceWatchers[previewSourceId]) {
      throw new Error('PreviewSource is already watching');
    }

    this.previewSourceWatchers[previewSourceId] = this.sourcesService.sourceUpdated.subscribe(
      sourceModel => {
        if (sourceModel.sourceId !== sourceId) return;
        const widget = this.getWidgetSource(sourceId);
        const source = widget.getSource();
        const newPreviewSettings = cloneDeep(source.getSettings());
        delete newPreviewSettings.shutdown;
        const config = this.widgetsConfig[widget.type];
        newPreviewSettings.url =
          config?.previewUrl || widget.getSettingsService().getApiSettings().previewUrl;
        const previewSource = widget.getPreviewSource();
        previewSource.updateSettings(newPreviewSettings);
        previewSource.refresh();
      },
    );
  }

  stopSyncPreviewSource(previewSourceId: string) {
    this.previewSourceWatchers[previewSourceId].unsubscribe();
    delete this.previewSourceWatchers[previewSourceId];
  }

  /**
   * Save a widget file to the given path
   * @param path the path to the save the widget file
   * @param widgetItemId the id of the widget to save
   */
  async saveWidgetFile(path: string, widgetItemId: string) {
    const widgetItem = this.scenesService.views.getSceneItem(widgetItemId);
    const data = this.exportWidgetJSON(widgetItem);
    const json = JSON.stringify(data, null, 2);

    await new Promise<void>((resolve, reject) => {
      fs.writeFile(path, json, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Detects widget type by URL
   * Used for converting browser_source to streamlabs widgets when importing OBS scene collection
   * returns -1 if it's no type detected
   */
  getWidgetTypeByUrl(url: string): WidgetType {
    if (!this.userService.views.isLoggedIn) return -1;

    const type = Number(
      Object.keys(WidgetDefinitions).find(WidgetType => {
        let regExpStr = WidgetDefinitions[WidgetType].url(this.hostsService.streamlabs, '')
          .split('?')[0]
          .replace(/\//g, '\\/');
        regExpStr = `${regExpStr}([A-z0-9]+)?(\\?token=[A-z0-9]+)?$`; // allow only 'token' get param
        return new RegExp(regExpStr).test(url);
      }),
    );
    return isNaN(type) ? -1 : type;
  }

  private register(sourceId: string) {
    const source = this.sourcesService.views.getSource(sourceId);
    if (source.getPropertiesManagerType() !== 'widget') return;
    const widgetType = source.getPropertiesManagerSettings().widgetType;

    this.ADD_WIDGET_SOURCE({
      sourceId: source.sourceId,
      type: widgetType,
      previewSourceId: '',
    });
  }

  private unregister(sourceId: string) {
    if (!this.state.widgetSources[sourceId]) return;
    const widgetSource = this.getWidgetSource(sourceId);
    if (widgetSource.previewSourceId) widgetSource.destroyPreviewSource();
    this.REMOVE_WIDGET_SOURCE(sourceId);
  }

  /**
   * Exports a serializable object representing the widget
   * which can be saved into a file and imported later.
   * @param widgetItem the SceneItem of the widget to export
   */
  private exportWidgetJSON(widgetItem: SceneItem): ISerializableWidget {
    const source = widgetItem.getSource();

    if (source.getPropertiesManagerType() !== 'widget') {
      throw new Error('Cannot export widget JSON for non-widget');
    }

    const settings = { ...source.getObsInput().settings };
    settings.url = '';

    return {
      settings,
      name: source.name,
      type: source.getPropertiesManagerSettings().widgetType,
      x: widgetItem.transform.position.x / this.videoService.baseWidth,
      y: widgetItem.transform.position.y / this.videoService.baseHeight,
      scaleX: widgetItem.transform.scale.x / this.videoService.baseWidth,
      scaleY: widgetItem.transform.scale.y / this.videoService.baseHeight,
    };
  }

  /**
   * Load a widget file from the given path
   * @param path the path to the widget file to laod
   * @param sceneId the id of the scene to load into
   */
  async loadWidgetFile(path: string, sceneId: string) {
    const scene = this.scenesService.views.getScene(sceneId);
    const json = await new Promise<string>((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject();
        } else {
          resolve(data.toString());
        }
      });
    });

    const widget = JSON.parse(json);
    this.importWidgetJSON(widget, scene);
  }

  /**
   * Imports a serialized widget into a scene
   * @param widget the widget to import
   * @param scene the scene to import into
   */
  private importWidgetJSON(widget: ISerializableWidget, scene: Scene) {
    let widgetItem: SceneItem;

    // First, look for an existing widget of the same type
    widgetItem = scene.getItems().find(item => {
      const source = item.getSource();
      if (source.getPropertiesManagerType() !== 'widget') return false;
      return source.getPropertiesManagerSettings().widgetType === widget.type;
    });

    // Otherwise, create a new one
    if (!widgetItem) {
      widgetItem = scene.createAndAddSource(scene.name, 'browser_source');
    }

    const source = widgetItem.getSource();

    source.setName(widget.name);
    source.updateSettings(widget.settings);
    source.replacePropertiesManager('widget', { widgetType: widget.type });
    widgetItem.setTransform({
      position: {
        x: widget.x * this.videoService.baseWidth,
        y: widget.y * this.videoService.baseHeight,
      },
      scale: {
        x: widget.scaleX * this.videoService.baseWidth,
        y: widget.scaleY * this.videoService.baseHeight,
      },
    });
  }

  get widgetsConfig() {
    return getWidgetsConfig(this.hostsService.streamlabs, this.userService.widgetToken);
  }

  get alertsConfig() {
    const platforms = Object.keys(this.userService.views.platforms || []) as TPlatform[];
    return getAlertsConfig(this.hostsService.streamlabs, platforms);
  }

  // make a request to widgets API
  async request(req: { url: string; method?: THttpMethod; body?: any }): Promise<any> {
    const method = req.method || 'GET';
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');

    const request = new Request(req.url, {
      headers,
      method,
      body: req.body ? JSON.stringify(req.body) : void 0,
    });

    return fetch(request)
      .then(res => {
        return Promise.resolve(res);
      })
      .then(handleResponse);
  }

  settingsInvalidated = new Subject();

  /**
   * Ask the WidgetSetting window to re-load data
   */
  invalidateSettingsWindow() {
    this.settingsInvalidated.next();
  }

  @mutation()
  private ADD_WIDGET_SOURCE(widgetSource: IWidgetSource) {
    Vue.set(this.state.widgetSources, widgetSource.sourceId, widgetSource);
  }

  @mutation()
  private REMOVE_WIDGET_SOURCE(sourceId: string) {
    Vue.delete(this.state.widgetSources, sourceId);
  }
}

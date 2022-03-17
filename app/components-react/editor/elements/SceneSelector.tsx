import React, { useState } from 'react';
import Fuse from 'fuse.js';
import cx from 'classnames';
import { Dropdown, Tooltip, List } from 'antd';
import * as remote from '@electron/remote';
import { Menu } from 'util/menus/Menu';
import { getOS } from 'util/operating-systems';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { TextInput } from 'components-react/shared/inputs';
import HelpTip from 'components-react/shared/HelpTip';
import Scrollable from 'components-react/shared/Scrollable';
import { useTree, IOnDropInfo } from 'components-react/hooks/useTree';
import { $t } from 'services/i18n';
import { EDismissable } from 'services/dismissables';
import { ERenderingMode } from '../../../../obs-api';
import styles from './SceneSelector.m.less';

export default function SceneSelector() {
  const {
    ScenesService,
    SceneCollectionsService,
    TransitionsService,
    SourceFiltersService,
    ProjectorService,
    EditorCommandsService,
  } = Services;

  const { treeSort } = useTree(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { scenes, activeSceneId, collections, activeCollection } = useVuex(() => ({
    scenes: ScenesService.views.scenes.map(scene => ({
      title: scene.name,
      key: scene.id,
      selectable: true,
      isLeaf: true,
    })),
    activeSceneId: ScenesService.views.activeSceneId,
    activeCollection: SceneCollectionsService.activeCollection,
    collections: SceneCollectionsService.collections,
  }));

  function showContextMenu(info: { event: React.MouseEvent }) {
    info.event.preventDefault();
    info.event.stopPropagation();
    const menu = new Menu();
    menu.append({
      label: $t('Duplicate'),
      click: () => ScenesService.actions.showDuplicateScene(activeSceneId),
    });
    menu.append({
      label: $t('Rename'),
      click: () => ScenesService.actions.showNameScene({ rename: activeSceneId }),
    });
    menu.append({
      label: $t('Remove'),
      click: removeScene,
    });
    menu.append({
      label: $t('Filters'),
      click: () => SourceFiltersService.actions.showSourceFilters(activeSceneId),
    });
    menu.append({
      label: $t('Create Scene Projector'),
      click: () =>
        ProjectorService.actions.createProjector(ERenderingMode.OBS_MAIN_RENDERING, activeSceneId),
    });
    menu.popup();
  }

  function makeActive(selectedKey: string) {
    ScenesService.actions.makeSceneActive(selectedKey);
  }

  function handleSort(info: IOnDropInfo) {
    const newState = treeSort(info, scenes);
    ScenesService.actions.setSceneOrder(newState.map(node => node.key as string));
  }

  function addScene() {
    ScenesService.actions.showNameScene();
  }

  function removeScene() {
    const name = ScenesService.views.activeScene?.name;
    remote.dialog
      .showMessageBox(remote.getCurrentWindow(), {
        title: 'Streamlabs Desktop',
        type: 'warning',
        message: $t('Are you sure you want to remove %{sceneName}?', { sceneName: name }),
        buttons: [$t('Cancel'), $t('OK')],
      })
      .then(({ response }) => {
        if (!response) return;
        if (!ScenesService.canRemoveScene()) {
          remote.dialog.showMessageBox({
            title: 'Streamlabs Desktop',
            message: $t('There needs to be at least one scene.'),
          });
          return;
        }

        EditorCommandsService.actions.executeCommand('RemoveSceneCommand', activeSceneId);
      });
  }

  function showTransitions() {
    TransitionsService.actions.showSceneTransitions();
  }

  function manageCollections() {
    SceneCollectionsService.actions.showManageWindow();
  }

  function loadCollection(id: string) {
    if (SceneCollectionsService.getCollection(id)?.operatingSystem !== getOS()) return;

    SceneCollectionsService.actions.load(id);
    setShowDropdown(false);
  }

  function filteredCollections() {
    if (!searchQuery) return collections;
    const fuse = new Fuse(collections, { shouldSort: true, keys: ['name'] });
    return fuse.search(searchQuery);
  }

  const DropdownMenu = (
    <div className={cx(styles.dropdownContainer, 'react')}>
      <TextInput
        placeholder={$t('Search')}
        value={searchQuery}
        onChange={setSearchQuery}
        nowrap
        uncontrolled={false}
      />
      <div className="link link--pointer" onClick={manageCollections}>
        {$t('Manage All')}
      </div>
      <hr style={{ borderColor: 'var(--border)' }} />
      <Scrollable style={{ height: 'calc(100% - 60px)' }}>
        {filteredCollections().map(collection => (
          <div
            key={collection.id}
            onClick={() => loadCollection(collection.id)}
            className={cx(styles.dropdownItem, {
              [styles.osMismatch]: getOS() !== collection.operatingSystem,
            })}
            data-name={collection.name}
          >
            <i
              className={cx(
                'fab',
                collection.operatingSystem === 'win32' ? 'fa-windows' : 'fa-apple',
              )}
            />
            {collection.name}
          </div>
        ))}
      </Scrollable>
    </div>
  );

  return (
    <>
      <div className={styles.topContainer} id="sceneSelector">
        <h3 style={{ flexGrow: 1 }}>{$t('Scene')}</h3>
        <Tooltip title={$t('Add a new Scene.')} placement="bottom">
          <i className="icon-add icon-button icon-button--lg" onClick={addScene} />
        </Tooltip>
        <Tooltip title={$t('Remove Scene.')} placement="bottom">
          <i className="icon-subtract icon-button icon-button--lg" onClick={removeScene} />
        </Tooltip>
        <Tooltip title={$t('Edit Scene Transitions.')} placement="bottom">
          <i className="icon-settings icon-button icon-button--lg" onClick={showTransitions} />
        </Tooltip>
      </div>
      <Scrollable style={{ height: '100%' }} className={styles.scenesContainer}>
        <List
          grid={{ gutter: 4, column: 2 }}
          dataSource={[
            ...scenes,
            {
              title: '+',
              key: 'plus',
            },
          ]}
          renderItem={item => {
            if (item.title === '+') {
              return (
                <List.Item style={{ marginBottom: 4 }}>
                  <div
                    onClick={addScene}
                    className={cx(styles.sceneCard)}
                    style={{ fontSize: 25, padding: '6px 0' }}
                  >
                    {item.title}
                  </div>
                </List.Item>
              );
            }
            return (
              <List.Item style={{ marginBottom: 4 }}>
                <div
                  onClick={() => makeActive(item.key)}
                  className={cx(styles.sceneCard, {
                    [styles.selected]: activeSceneId === item.key,
                  })}
                >
                  {item.title}
                </div>
              </List.Item>
            );
          }}
        />
      </Scrollable>
      <HelpTip
        title={$t('Scene Collections')}
        dismissableKey={EDismissable.SceneCollectionsHelpTip}
        position={{ top: '-8px', left: '102px' }}
      >
        <div>
          {$t(
            'This is where your Scene Collections live. Clicking the title will dropdown a menu where you can view & manage.',
          )}
        </div>
      </HelpTip>
    </>
  );
}

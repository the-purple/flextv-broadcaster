import React, { useState, useRef } from 'react';
import cx from 'classnames';
import { Dropdown, Tooltip, List } from 'antd';
import * as remote from '@electron/remote';
import { DownOutlined } from '@ant-design/icons';
import { Menu } from 'util/menus/Menu';
import { getOS } from 'util/operating-systems';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import HelpTip from 'components-react/shared/HelpTip';
import Scrollable from 'components-react/shared/Scrollable';
import { useTree, IOnDropInfo } from 'components-react/hooks/useTree';
import { $t } from 'services/i18n';
import { EDismissable } from 'services/dismissables';
import styles from './SceneSelector.m.less';
import useBaseElement from './hooks';
import { IScene } from 'services/scenes';

function SceneSelector() {
  const {
    ScenesService,
    SceneCollectionsService,
    TransitionsService,
    SourceFiltersService,
    ProjectorService,
    EditorCommandsService,
  } = Services;

  const { treeSort } = useTree(true);

  const [showDropdown, setShowDropdown] = useState(false);
  const { scenes, activeSceneId, activeScene, collections, activeCollection } = useVuex(() => ({
    scenes: ScenesService.views.scenes.map(scene => ({
      title: <TreeNode scene={scene} removeScene={removeScene} />,
      key: scene.id,
      selectable: true,
      isLeaf: true,
    })),
    activeScene: ScenesService.views.activeScene,
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
      click: () => removeScene(activeScene),
    });
    menu.append({
      label: $t('Filters'),
      click: () => SourceFiltersService.actions.showSourceFilters(activeSceneId),
    });
    // menu.append({
    //   label: $t('Create Scene Projector'),
    //   click: () =>
    //     ProjectorService.actions.createProjector(ERenderingMode.OBS_MAIN_RENDERING, activeSceneId),
    // });
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

  function showTransitions() {
    TransitionsService.actions.showSceneTransitions();
  }

  function manageCollections() {
    SceneCollectionsService.actions.showManageWindow();
  }

  function removeScene(scene: IScene | null) {
    if (!scene) return;
    const name = scene.name;
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

        EditorCommandsService.actions.executeCommand('RemoveSceneCommand', scene.id);
      });
  }

  function loadCollection(id: string) {
    if (SceneCollectionsService.getCollection(id)?.operatingSystem !== getOS()) return;

    SceneCollectionsService.actions.load(id);
    setShowDropdown(false);
  }

  const DropdownMenu = (
    <div className={cx(styles.dropdownContainer, 'react')}>
      <div className={styles.dropdownItem} onClick={manageCollections} style={{ marginTop: '6px' }}>
        <i className="icon-edit" style={{ marginRight: '6px' }} />
        {$t('Manage Scene Collections')}
      </div>
      <hr style={{ borderColor: 'var(--border)' }} />
      <span className={styles.whisper}>{$t('Your Scene Collections')}</span>
      <Scrollable style={{ height: 'calc(100% - 60px)' }}>
        {collections.map(collection => (
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
        <Tooltip title={$t('Edit Scene Transitions.')} placement="bottomRight">
          <i className="icon-transition icon-button icon-button--lg" onClick={showTransitions} />
        </Tooltip>
        {/*
         <Tooltip title={$t('Remove Scene.')} placement="bottom">
          <i className="icon-subtract icon-button icon-button--lg" onClick={removeScene} />
        </Tooltip>
        */}
        <Dropdown
          overlay={DropdownMenu}
          trigger={['click']}
          getPopupContainer={() => document.getElementById('sceneSelector')!}
          visible={showDropdown}
          onVisibleChange={setShowDropdown}
          placement="bottomLeft"
        >
          <span className={styles.activeSceneContainer} data-name="SceneSelectorDropdown">
            <DownOutlined style={{ marginRight: '4px' }} />
            <span className={styles.activeScene}>{activeCollection?.name}</span>
          </span>
        </Dropdown>
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
                  onContextMenu={e => {
                    showContextMenu({ event: e });
                    return false;
                  }}
                  onClick={() => {
                    makeActive(item.key);
                  }}
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

function TreeNode(p: { scene: IScene; removeScene: (scene: IScene) => void }) {
  const { ScenesService, EditorCommandsService } = Services;

  return (
    <div className={styles.sourceTitleContainer} data-name={p.scene.name} data-role="scene">
      <span className={styles.sourceTitle}>{p.scene.name}</span>
      <Tooltip title={$t('Remove Scene.')} placement="left">
        <i onClick={() => p.removeScene(p.scene)} className="icon-trash" />
      </Tooltip>
    </div>
  );
}

export default function SceneSelectorElement() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { renderElement } = useBaseElement(
    <SceneSelector />,
    { x: 200, y: 120 },
    containerRef.current,
  );

  return (
    <div
      ref={containerRef}
      data-name="SceneSelector"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {renderElement()}
    </div>
  );
}

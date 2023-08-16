import React, { useState, useEffect, useMemo } from 'react';
import { Services } from '../../service-provider';
import { IHotkeysSet, IHotkey } from 'services/hotkeys';
import HotkeyGroup from './HotkeyGroup';
import { $t } from '../../../services/i18n';
import mapValues from 'lodash/mapValues';
import Fuse from 'fuse.js';
import type { Scene, Source } from 'app-services';

interface IAugmentedHotkey extends IHotkey {
  // Will be scene or source name
  categoryName?: string;
}

interface IAugmentedHotkeySet {
  general: IAugmentedHotkey[];
  sources: Dictionary<IAugmentedHotkey[]>;
  scenes: Dictionary<IAugmentedHotkey[]>;
  markers: IAugmentedHotkey[];
}

function hasHotkeys(hotkeyDict: Dictionary<IAugmentedHotkey[]>) {
  return Object.values(hotkeyDict).some(hotkeys => hotkeys.length);
}

type HotkeysProps = {
  globalSearchStr: string;
  scanning: boolean;
  highlightSearch: (searchString: string) => void;
};

const mkFilterHotkeys = (searchString: string) => (hotkeys: IHotkey[]): IHotkey[] => {
  return new Fuse(hotkeys, {
    keys: ['description', 'categoryName'],
    threshold: 0.4,
    shouldSort: true,
  }).search(searchString);
};

// Safe-guard against the object (source or scene) not being found, though unlikely
const setCategoryNameFrom = (srcOrScene: Source | Scene | null) => (hotkey: IAugmentedHotkey) => {
  if (!srcOrScene?.name) return hotkey;
  // Mutating the original object is required for bindings to work
  // TODO: We should refactor this to not rely on mutating the original objects.
  hotkey.categoryName = srcOrScene.name;
  return hotkey;
};

export default function Hotkeys(props: HotkeysProps) {
  const { globalSearchStr: searchString, scanning, highlightSearch } = props;
  const { HotkeysService, SourcesService, ScenesService } = Services;
  const [hotkeySet, setHotkeysSet] = useState<IHotkeysSet | null>(null);

  useEffect(() => {
    if (!hotkeySet) {
      // We don't want hotkeys registering while trying to bind.
      // We may change our minds on this in the future.
      HotkeysService.actions.unregisterAll();

      HotkeysService.actions.return
        .getHotkeysSet()
        .then(setHotkeysSet)
        .then(() => highlightSearch(searchString));
    }

    return () => {
      if (hotkeySet) {
        HotkeysService.actions.applyHotkeySet(hotkeySet);
      }
    };
  }, [hotkeySet]);

  const emptyHotkeySet: IAugmentedHotkeySet = {
    general: {},
    sources: {},
    scenes: {},
    markers: {},
  } as IAugmentedHotkeySet;

  // Only calculate this once
  const augmentedHotkeySet = useMemo<IAugmentedHotkeySet>(() => {
    if (!hotkeySet) {
      return emptyHotkeySet;
    }

    return {
      general: hotkeySet.general,
      sources: mapValues(hotkeySet.sources, (hotkeys, sourceId) => {
        return hotkeys.map(setCategoryNameFrom(SourcesService.views.getSource(sourceId)));
      }),
      scenes: mapValues(hotkeySet.scenes, (hotkeys, sceneId) => {
        return hotkeys.map(setCategoryNameFrom(ScenesService.views.getScene(sceneId)));
      }),
      markers: hotkeySet.markers,
    };
  }, [hotkeySet]);

  const filteredHotkeySet = useMemo<IAugmentedHotkeySet>(() => {
    if (!hotkeySet) {
      return emptyHotkeySet;
    }

    const filterHotkeys = mkFilterHotkeys(searchString);

    const filteredHotkeySet: IAugmentedHotkeySet = searchString
      ? {
          general: filterHotkeys(augmentedHotkeySet.general),
          sources: mapValues(augmentedHotkeySet.sources, filterHotkeys),
          scenes: mapValues(augmentedHotkeySet.scenes, filterHotkeys),
          markers: filterHotkeys(augmentedHotkeySet.markers),
        }
      : augmentedHotkeySet;

    return filteredHotkeySet;
  }, [augmentedHotkeySet, searchString]);

  // Highlight search results when the search string changes
  useEffect(() => highlightSearch(searchString), [searchString]);

  if (!hotkeySet) {
    return <div />;
  }
  const isSearch = !!searchString || scanning;

  const generalHotkeys = filteredHotkeySet.general;
  const hasGeneralHotkeys = !!generalHotkeys.length;

  const sceneHotkeys = filteredHotkeySet.scenes;
  const hasSceneHotkeys = hasHotkeys(sceneHotkeys);

  const sourceHotkeys = filteredHotkeySet.sources;
  const hasSourceHotkeys = hasHotkeys(sourceHotkeys);

  const markerHotkeys = filteredHotkeySet.markers;
  const hasMarkers = !!markerHotkeys.length;

  function renderHotkeyGroup(id: string, hotkeys: any, title: string) {
    return <HotkeyGroup key={id} title={title} hotkeys={hotkeys} isSearch={isSearch} />;
  }

  function renderScenesHotkeyGroup(sceneId: string) {
    const sceneHotkeys = filteredHotkeySet.scenes[sceneId];
    const scene = ScenesService.views.getScene(sceneId);

    return scene ? renderHotkeyGroup(sceneId, sceneHotkeys, scene.name) : null;
  }

  function renderSourcesHotkeyGroup(sourceId: string) {
    const sourceHotkeys = filteredHotkeySet.sources[sourceId];
    const source = SourcesService.views.getSource(sourceId);

    return source ? renderHotkeyGroup(sourceId, sourceHotkeys, source.name) : null;
  }

  return (
    <div>
      {hasGeneralHotkeys && (
        <HotkeyGroup hotkeys={generalHotkeys} isSearch={isSearch} title={null} />
      )}
      {hasSceneHotkeys && (
        <>
          <h2>{$t('Scenes')}</h2>
          {Object.keys(sceneHotkeys).map(renderScenesHotkeyGroup)}
        </>
      )}
      {hasSourceHotkeys && (
        <>
          <h2>{$t('Sources')}</h2>
          {Object.keys(sourceHotkeys).map(renderSourcesHotkeyGroup)}
        </>
      )}
      {hasMarkers && (
        <>
          <h2>{$t('Markers')}</h2>
          <HotkeyGroup hotkeys={markerHotkeys} isSearch={isSearch} title={null} />
        </>
      )}
    </div>
  );
}

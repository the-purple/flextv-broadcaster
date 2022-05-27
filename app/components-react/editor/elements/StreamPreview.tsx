import React, { useRef } from 'react';
import Display from 'components-react/shared/Display';
import Util from 'services/utils';
import { ERenderingMode } from '../../../../obs-api';
import styles from './BaseElement.m.less';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import useBaseElement from './hooks';
import { useVuex } from 'components-react/hooks';

export default function StreamPreview() {
  const { WindowsService, StreamingService } = Services;

  const containerRef = useRef<HTMLDivElement>(null);

  const { renderElement } = useBaseElement(
    <StreamPreviewElement />,
    { x: 0, y: 0 },
    containerRef.current,
  );

  const { hideStyleBlockers, selectiveRecording } = useVuex(() => ({
    hideStyleBlockers: WindowsService.state[Util.getCurrentUrlParams().windowId].hideStyleBlockers,
    selectiveRecording: StreamingService.state.selectiveRecording,
  }));

  function SelectiveRecordingMessage() {
    return (
      <div className={styles.container}>
        <span className={styles.empty}>
          {$t('This element requires Selective Recording to be enabled')}
        </span>
      </div>
    );
  }

  function StreamPreviewElement() {
    if (!selectiveRecording) return <SelectiveRecordingMessage />;
    if (hideStyleBlockers) return <div />;
    return <Display renderingMode={ERenderingMode.OBS_STREAMING_RENDERING} />;
  }

  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {renderElement()}
    </div>
  );
}

import * as remote from '@electron/remote';
import React, { useEffect, useState } from 'react';
import BrowserView from 'components-react/shared/BrowserView';
import { Services } from 'components-react/service-provider';
import Spinner from 'components-react/shared/Spinner';

export default function FlexTvWidgetSetting() {
  const { FlexTvService } = Services;
  const [url, setUrl] = useState('');

  useEffect(() => {
    FlexTvService.fetchHelperToken()
      .then(token => {
        const url = `${FlexTvService.helperUrl}${encodeURIComponent(token)}`;
        setUrl(url);
      })
      .catch(() => {
        remote.dialog.showMessageBox({
          title: '위젯 설정 열기 실패',
          type: 'warning',
          message:
            '일시적인 문제가 발생하였습니다. 문제가 지속적으로 발생한다면 고객센터에 문의 부탁드립니다.',
        });
      });
  }, []);
  if (!url) {
    return <Spinner />;
  }

  return (
    <BrowserView
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
      }}
      src={url}
    />
  );
}

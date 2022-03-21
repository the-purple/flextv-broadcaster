import React, { useMemo } from 'react';
import { Empty, Row, Button, Col, PageHeader } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { WidgetType, FlexTvWidgetTypeNames } from 'services/widgets';
import { byOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import SourceTag from './SourceTag';
import FlexTVSourceTag from './FlexTVSourceTag';
import { useSourceShowcaseSettings } from './useSourceShowcase';

const essentialSources = [
  'monitor_capture',
  'window_capture',
  'dshow_input',
  'wasapi_input_capture',
  'wasapi_output_capture',
  'screen_capture',
];

export default function SourceGrid(p: { activeTab: string }) {
  const {
    SourcesService,
    UserService,
    ScenesService,
    WindowsService,
    CustomizationService,
  } = Services;

  const { demoMode, designerMode, isLoggedIn, linkedPlatforms, primaryPlatform } = useVuex(() => ({
    demoMode: CustomizationService.views.isDarkTheme ? 'night' : 'day',
    designerMode: CustomizationService.views.designerMode,
    isLoggedIn: UserService.views.isLoggedIn,
    linkedPlatforms: UserService.views.linkedPlatforms,
    primaryPlatform: UserService.views.platform?.type,
  }));

  const { availableAppSources } = useSourceShowcaseSettings();

  const iterableWidgetTypes = Object.keys(WidgetType).filter((type: string) => {
    return !Number.isInteger(Number(type)) && FlexTvWidgetTypeNames.includes(type);
  });

  const availableSources = useMemo(
    () =>
      SourcesService.getAvailableSourcesTypesList().filter(type => {
        // Freetype on windows is hidden
        if (type.value === 'text_ft2_source' && byOS({ [OS.Windows]: true, [OS.Mac]: false })) {
          return;
        }
        return !(type.value === 'scene' && ScenesService.views.scenes.length <= 1);
      }),
    [],
  );

  function showContent(key: string) {
    const correctKey = ['all', key].includes(p.activeTab);
    if (UserService.state.auth?.primaryPlatform === 'tiktok' && key === 'widgets') return false;
    if (key === 'apps') {
      return correctKey && availableAppSources.length > 0;
    }
    return correctKey;
  }

  function handleAuth() {
    WindowsService.closeChildWindow();
    UserService.showLogin();
  }

  return (
    <Scrollable style={{ height: 'calc(100% - 64px)' }}>
      <Row
        gutter={[8, 8]}
        style={{ marginLeft: '24px', marginRight: '24px', paddingBottom: '24px' }}
      >
        {showContent('general') && (
          <>
            <Col span={24}>
              <PageHeader style={{ paddingLeft: 0 }} title={'자주사용하는 소스'} />
            </Col>
            {availableSources
              .filter(source => essentialSources.includes(source.value))
              .map(source => (
                <SourceTag key={source.value} type={source.value} />
              ))}
            <Col span={24}>
              <PageHeader style={{ paddingLeft: 0 }} title={'일반 소스'} />
            </Col>
            {availableSources
              .filter(source => !essentialSources.includes(source.value))
              .map(source => (
                <SourceTag key={source.value} type={source.value} />
              ))}
            <SourceTag key="replay" name={$t('Instant Replay')} type="replay" />
          </>
        )}
        {showContent('widgets') && (
          <>
            {!isLoggedIn ? (
              <Empty description="위젯을 사용하려면 로그인이 필요 합니다.">
                <Button onClick={handleAuth}>{$t('Click here to log in')}</Button>
              </Empty>
            ) : (
              <>
                {iterableWidgetTypes.map(widgetType => (
                  <FlexTVSourceTag key={widgetType} type={widgetType} />
                ))}
              </>
            )}
          </>
        )}
      </Row>
    </Scrollable>
  );
}

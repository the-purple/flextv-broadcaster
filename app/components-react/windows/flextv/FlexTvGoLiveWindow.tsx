import React, { useState, useEffect } from 'react';
import { Spin, Button, Tooltip } from 'antd';
import { ModalLayout } from '../../shared/ModalLayout';
import { useOnCreate, useOnDestroy } from '../../hooks';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import Form from '../../shared/inputs/Form';
import { alertAsync } from '../../modals';
import { TextInput, RadioInput, CheckboxInput, ListInput } from '../../shared/inputs';
import { useGoLiveSettingsRoot } from '../go-live/useGoLiveSettings';
import { IFlexTvTheme } from 'services/platforms/flextv';

export default function FlexTvGoLiveWindow() {
  const { StreamingService, WindowsService, FlexTvService } = Services;
  const {
    error,
    lifecycle,
    checklist,
    goLive,
    isLoading,
    prepopulate,
    updateSettings,
    form,
  } = useGoLiveSettingsRoot();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('5');
  const [resolution, useResolution] = useState('720');
  const [useMinFanLevel, setUseMinFanLevel] = useState('false');
  const [minRatingLevel, setMinFanLevel] = useState('1');
  const [isForAdult, setIsForAdult] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [password, setPassword] = useState('');
  const [themeOptions, setThemeOptions] = useState<IFlexTvTheme[]>([]);
  const [termAgreed, setTermAgreed] = useState('false');
  const [useHigh, setUseHigh] = useState(false);

  const shouldShowConfirm = ['prepopulate', 'waitForNewSettings'].includes(lifecycle);

  // clear failed checks and warnings on window close
  useOnDestroy(() => {
    if (checklist.startVideoTransmission !== 'done') {
      StreamingService.actions.resetInfo();
    }
  });

  useOnCreate(() => {
    prepopulate();
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([FlexTvService.fetchThemes(), FlexTvService.fetchStreamConfig()]).then(result => {
      const [themes = [], streamOptions] = result;

      setThemeOptions(themes);
      setLoading(false);
      if (!streamOptions) return;

      setTitle(streamOptions.title ?? '');
      setTheme(streamOptions.theme ?? '5');
      setIsSecret(!!streamOptions.password);
      setPassword(streamOptions.password ?? '');
      setIsForAdult(streamOptions.isForAdult ?? false);
      setUseHigh(!!streamOptions.useHigh);
    });
  }, []);

  function close() {
    WindowsService.actions.closeChildWindow();
  }

  async function handleConfirm() {
    if (!title) {
      return alertAsync('방속제목을 입력해 주세요');
    }
    updateSettings({
      platforms: {
        flextv: {
          enabled: true,
          useCustomFields: true,
          title,
          theme,
          resolution,
          minRatingLevel:
            useMinFanLevel === 'true' && minRatingLevel ? Number(minRatingLevel) : undefined,
          password,
          isForAdult,
        },
      },
    });
    setLoading(true);
    try {
      await goLive();
    } catch (_e: unknown) {
      setLoading(false);
    }
    close();
  }

  function renderFooter() {
    return (
      <Form layout={'inline'}>
        {/* CLOSE BUTTON */}
        <Button onClick={close}>{$t('Close')}</Button>
        {/* GO LIVE BUTTON */}
        {shouldShowConfirm && (
          <Button
            type="primary"
            onClick={handleConfirm}
            disabled={loading || !!error || termAgreed === 'false'}
          >
            {$t('Confirm & Go Live')}
          </Button>
        )}
      </Form>
    );
  }

  return (
    <ModalLayout footer={renderFooter()}>
      <Spin spinning={loading}>
        <Form
          form={form}
          style={{
            position: 'relative',
            height: '100%',
          }}
          layout="vertical"
          name="editStreamForm"
        >
          <div className="section thin">
            <TextInput label={'방송제목'} value={title} onChange={setTitle} />
          </div>
          <div className="section thin" style={{ width: 150 }}>
            <ListInput
              label={'카테고리'}
              options={themeOptions.map((t: any) => ({ value: t.value, label: t.text }))}
              value={theme}
              onChange={setTheme}
            />
          </div>
          <div className="section thin">
            <RadioInput
              label={'방송형태'}
              options={[
                {
                  value: 'false',
                  label: '일반방송',
                },
                {
                  value: 'true',
                  label: '팬방송',
                },
              ]}
              value={useMinFanLevel}
              onChange={setUseMinFanLevel}
              direction={'horizontal'}
            />
            {useMinFanLevel === 'true' && (
              <ListInput
                label={'팬 최소 등급'}
                value={minRatingLevel}
                onChange={setMinFanLevel}
                options={[
                  {
                    label: 'BRONZE',
                    value: '1',
                  },
                  {
                    label: 'SILVER',
                    value: '2',
                  },
                  {
                    label: 'GOLD',
                    value: '3',
                  },
                  {
                    label: 'RUBY',
                    value: '4',
                  },
                  {
                    label: 'DIAMOND',
                    value: '5',
                  },
                ]}
              />
            )}
          </div>
          <div className="section thin">
            <h3 className="section-title">{'방송속성'}</h3>
            <CheckboxInput label={'연령제한'} value={isForAdult} onChange={setIsForAdult} />
            <CheckboxInput
              label={'비밀번호방'}
              value={isSecret}
              onChange={checked => {
                if (!checked) {
                  setPassword('');
                }
                setIsSecret(checked);
              }}
              style={{
                display: 'inline-block',
                width: 120,
              }}
            />
            {isSecret ? (
              <div style={{ display: 'inline-block', width: 300 }}>
                <TextInput
                  label={'비밀번호'}
                  value={password}
                  onChange={setPassword}
                  nowrap={true}
                />
              </div>
            ) : null}
          </div>
          <div className="section thin">
            <div className="broadcast-agree">
              <h2>플렉스티비 방송 준수사항 동의</h2>
              <div
                className="agree-box"
                style={{
                  overflow: 'scroll',
                  maxHeight: 250,
                  border: '1px solid #4F5E65',
                  padding: '10px',
                  borderRadius: 4,
                }}
              >
                <div>
                  <b>
                    플렉스티비 방송 준수사항
                    <br />
                    <span className="strong">아래 내용의 방송을 하지 않겠습니다</span>
                    <br />
                    <br />
                  </b>
                  <b>*음란물을 방송하는 행위</b>
                  <ul>
                    <li>음란물 방송 신고/적발 시 서비스 영구정지 및 형사고발 조치</li>
                    <li>
                      음란물을 제작, 판매, 유포하는 행위는 정보통신망이용촉진 및 정보보호 등에 관한
                      법률(1년 이하의 징역 또는 1천만원 이하의 벌금) 및 청소년보호법(3년 이하의 징역
                      또는 2천만원 이하의 벌금) 위반 행위로 형사처벌 됨을 알려드립니다.
                    </li>
                  </ul>
                  <b>타인의 저작권을 침해하는 방송의 내용</b>
                  <ul>
                    <li>
                      저작권이 확보되지 않은 영상, 음원, 이미지, 글꼴 타인 또는 타 단체의 권리를
                      침해하거나 명예를 훼손하는 방송 행위
                    </li>
                    <li>
                      개인의 사생활 침해, 명예훼손, 초상권을 침해하는 내용의 방송 욕설 또는 언어폭력
                      등의 저속한 표현으로 특정인의 인격을 모독하거나 불쾌감 또는 혐오감을
                      불러일으키는 방송
                    </li>
                    <li>
                      공공질서 및 미풍양속에 위반되는 저속, 음란한 내용의 방송 회사와의 사전 협의
                      없는 사업적, 영리 목적의 행위
                    </li>
                    <li>
                      19세 이상 연령제한 없이 사행성, 음주, 흡연, 잔인, 폭력적인 장면을 방송하는
                      행위 (게임포함) 유사투자자문업에 등록하지 않는 BJ가 리딩방송(직접적인
                      투자조언, 종목추천 등)을 통한 영리 행위
                    </li>
                  </ul>
                  <b>기타 유의사항</b>
                  <ul>
                    <li>
                      <strong>
                        *허가 없이 주거ㆍ관리 건물에 침입하거나, 주거ㆍ관리 없는 흉ㆍ폐가에 정당한
                        이유없이 들어가는 행위
                      </strong>
                      <span>
                        (정당한 이유는 소유자의 허락을 받거나, 긴급한 위험을 방지 할 목적 기타
                        공익적인 이유가 있는 경우)
                      </span>
                    </li>
                    <li>
                      <strong>
                        *게스트 방송시 게스트 동의 및 신분증 확인은 필수이며, 신분이 확인되질 않는
                        경우 방송이 종료 됩니다.
                      </strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginLeft: 30 }}>
            <RadioInput
              nowrap={true}
              options={[
                {
                  value: 'true',
                  label: '동의',
                },
                {
                  value: 'false',
                  label: '동의하지 않음',
                },
              ]}
              value={termAgreed}
              onChange={setTermAgreed}
            />
          </div>
        </Form>
      </Spin>
    </ModalLayout>
  );
}

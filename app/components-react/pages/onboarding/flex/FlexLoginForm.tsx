import React from 'react';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { TextInput } from 'components-react/shared/inputs/TextInput';
import { TPlatform, IUserAuth } from 'services/platforms';
import { $t } from 'services/i18n';
import styles from '../Connect.m.less';
import { jfetch } from 'util/requests';
import * as remote from '@electron/remote';
import PlatformLogo from '../../../shared/PlatformLogo';

interface FlexAuthResult {
  id: string;
  nickname: string;
  channelId: string;
  token: string;
}

export default function FlexLoginForm() {
  const next = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const request = new Request(`${Services.FlexTvService.apiBase}/api/auth/signin`, {
      headers,
      method: 'POST',
      body: JSON.stringify({ loginId: 'newbj2', password: '1234' }),
    });
    try {
      const data: FlexAuthResult = await jfetch(request);
      const auth = parseAuthFromToken(
        String(data.id),
        data.nickname,
        String(data.channelId),
        data.token,
      );

      return Services.UserService.startFlexAuth(auth);
    } catch (e: unknown) {
      return remote.dialog.showMessageBox({
        title: '계정정보 불일치',
        type: 'warning',
        message: '계정정보가 일치하지 않습니다.',
      });
    }
  };

  const parseAuthFromToken = (
    id: string,
    nickname: string,
    channelId: string,
    token: string,
  ): IUserAuth => {
    return {
      widgetToken: token,
      apiToken: token,
      primaryPlatform: 'flextv' as TPlatform,
      platforms: {
        flextv: {
          type: 'flextv',
          username: nickname,
          token,
          channelId,
          id,
        },
      },
      hasRelogged: true,
    };
  };

  const openHelp = () => {
    return remote.shell.openExternal(`${Services.FlexTvService.baseUrl}/cs/guide`);
  };

  const openSignup = () => {
    return remote.shell.openExternal(`${Services.FlexTvService.baseUrl}/signup`);
  };

  const openFindMember = () => {
    return remote.shell.openExternal(`${Services.FlexTvService.baseUrl}/member/find/findId`);
  };

  return (
    <div>
      <div className={styles.container} style={{ height: '300px' }}>
        <p>
          <PlatformLogo platform={'flextv'} />
        </p>
        <div className="section">
          <TextInput />
          <TextInput />
        </div>
        <div className="section">
          <button
            className={cx('button button--action', styles.flexLoginButton)}
            onClick={() => next()}
          >
            {$t('Log In')}
          </button>
        </div>
        <p>
          <a className={styles['link-button']} onClick={() => openFindMember()}>
            아이디 찾기 & 비밀번호 찾기
          </a>
          <span className={styles.divider} />
          <a className={styles['link-button']} onClick={() => openSignup()}>
            회원가입
          </a>
          <span className={styles.divider} />
          <a className={styles['link-button']} onClick={() => {}}>
            {$t('Back')}
          </a>
        </p>
      </div>
    </div>
  );
}

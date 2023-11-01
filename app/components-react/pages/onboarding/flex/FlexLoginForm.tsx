import React from 'react';
import BrowserView from 'components-react/shared/BrowserView';
import { Services } from 'components-react/service-provider';
import { TPlatform } from 'services/platforms';
import { IUserAuth } from 'services/user';
import { jfetch } from 'util/requests';

const OAUTH_ACCESS_KEY = 'flx_oauth_access';
const OAUTH_REFRESH_KEY = 'flx_oauth_refresh';

const isProd = process.env.NODE_ENV === 'production';

const BASE_URL = isProd ? 'https://www.flextv.co.kr' : 'https://www.hotaetv.com';

interface FlexProfileResult {
  profile: {
    id: number;
    loginId: string;
    nickname: string;
    channelId: number;
  };
}

export default function FlexLoginForm() {
  const parseAuthFromToken = (
    id: string,
    nickname: string,
    channelId: string,
    token: string,
    refreshToken: string,
    expireAt?: number,
  ): IUserAuth => {
    return {
      widgetToken: token,
      apiToken: refreshToken,
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

  async function login({ accessToken = '', refreshToken = '', expireAt = 0 }) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', `Bearer ${accessToken}`);
    const request = new Request(`${Services.FlexTvService.apiBase}/api/my/profile`, {
      headers,
      method: 'GET',
    });
    const data: FlexProfileResult = await jfetch(request);

    const auth = parseAuthFromToken(
      String(data.profile.id),
      data.profile.nickname,
      String(data.profile.channelId),
      accessToken,
      refreshToken,
      expireAt,
    );

    return Services.UserService.startFlexAuth(auth).then(() => {
      return Services.NavigationService.navigate('Studio');
    });
  }

  function onBrowserViewReady(view: Electron.BrowserView) {
    // view.webContents.openDevTools();
    view.webContents.on('did-navigate-in-page', (e, url) => {
      view.webContents.session.cookies.get({}).then(cookies => {
        if (!cookies) return;
        const cookie = cookies.find(c => c.name === OAUTH_ACCESS_KEY);
        const refreshCookie = cookies.find(c => c.name === OAUTH_REFRESH_KEY);
        if (cookie && refreshCookie) {
          const accessToken = cookie.value;
          return login({
            accessToken,
            refreshToken: refreshCookie?.value ?? '',
          });
        }
      });
    });
  }

  return (
    <BrowserView
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
      }}
      src={`${BASE_URL}/signin`}
      onReady={onBrowserViewReady}
    />
  );
}

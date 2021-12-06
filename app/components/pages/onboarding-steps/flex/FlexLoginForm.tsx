import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { OnboardingService } from 'services/onboarding';
import { TPlatform, IUserAuth } from 'services/platforms';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import styles from '../Connect.m.less';
import { UserService } from 'services/user';
import { jfetch } from 'util/requests';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { StreamSettingsService } from 'services/settings/streaming';
import electron from 'electron';
import PlatformLogo from 'components/shared/PlatformLogo';
import { FlexTvService } from 'services/platforms/flextv';

export class ConnectProps {
  continue: () => void = () => {};
}

interface FlexAuthResult {
  id: string;
  nickname: string;
  channelId: string;
  token: string;
}

@Component({ props: createProps(ConnectProps) })
export default class FlexLoginForm extends TsxComponent<ConnectProps> {
  @Inject() private onboardingService: OnboardingService;
  @Inject() private userService: UserService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private flexTvService: FlexTvService;

  idMetadata = metadata.text({ title: '아이디', name: 'id', fullWidth: true });
  pwdMetadata = metadata.text({ title: '비밀번호', name: 'password', masked: true, fullWidth: true });
  key = '';
  id = '';
  password = '';

  async next() {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const request = new Request(`${this.flexTvService.apiBase}/api/auth/signin`, {
      headers,
      method: 'POST',
      body: JSON.stringify({ loginId: this.id, password: this.password }),
    });
    try {
      const data: FlexAuthResult = await jfetch(request);
      const auth = this.parseAuthFromToken(
        String(data.id),
        data.nickname,
        String(data.channelId),
        data.token,
      );

      this.props.continue();

      return this.userService.startFlexAuth(auth);
    } catch (e: unknown) {
      return electron.remote.dialog.showMessageBox({
        title: '계정정보 불일치',
        type: 'warning',
        message: '계정정보가 일치하지 않습니다.',
      });
    }
  }

  private parseAuthFromToken(
    id: string,
    nickname: string,
    channelId: string,
    token: string,
  ): IUserAuth {
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
  }

  openHelp() {
    electron.remote.shell.openExternal(`${this.flexTvService.baseUrl}/cs/guide`);
  }

  openSignup() {
    electron.remote.shell.openExternal(`${this.flexTvService.baseUrl}/signup`);
  }

  openFindMember() {
    electron.remote.shell.openExternal(`${this.flexTvService.baseUrl}/member/find/findId`);
  }

  render() {
    return (
      <div>
        <div class={styles.container} style={{ height: '50%' }}>
          <p>
            <PlatformLogo platform={'flextv'} />
          </p>
          <h1>FlexTV에 연결하기</h1>

          <div class="section">
            <VFormGroup vModel={this.id} metadata={this.idMetadata} />
            <VFormGroup vModel={this.password} metadata={this.pwdMetadata} />
            <a className={styles['link-button']} onClick={() => this.openFindMember()}>
              아이디 찾기 & 비밀번호 찾기
            </a>
          </div>

          <p>
            <button
              class={cx('button button--action', styles.flexLoginButton)}
              onClick={() => this.next()}
            >
              {$t('Log In')}
            </button>
            <button
              class={cx('button button--prime', styles.flexSignUpButton)}
              onClick={() => this.openSignup()}
            >
              회원 가입 하기!
            </button>
            <a class={styles['link-button']} onClick={() => this.props.continue()}>
              {$t('Back')}
            </a>
          </p>
        </div>
      </div>
    );
  }
}

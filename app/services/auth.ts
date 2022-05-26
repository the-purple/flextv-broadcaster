import { UserService } from './user';
import { Service, Inject, InitAfter } from './core';

@InitAfter('UserService')
export class AuthService extends Service {
  @Inject() userService: UserService;

  init() {
    const twoHour = 60 * 60 * 1000 * 2;
    setInterval(() => {
      return this.userService.autoRefreshToken();
    }, twoHour);
  }
}

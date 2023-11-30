import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signUp() {
    return { msg: 'signUP' };
  }

  signIn() {
    return { msg: 'signIN' };
  }
}

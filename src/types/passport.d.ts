declare module 'passport-kakao' {
  import { Strategy as BaseStrategy } from 'passport';

  export class Strategy extends BaseStrategy {
    constructor(options: any, verify: any);
    authenticate(req: any, options?: any): any;
  }
}

declare module 'passport-naver' {
  import { Strategy as BaseStrategy } from 'passport';

  export class Strategy extends BaseStrategy {
    constructor(options: any, verify: any);
    authenticate(req: any, options?: any): any;
  }
}

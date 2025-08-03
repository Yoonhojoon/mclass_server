declare module 'passport-kakao' {
  import { Strategy } from 'passport';

  export class Strategy extends Strategy {
    constructor(options: any, verify: any);
    authenticate(req: any, options?: any): any;
  }
}

declare module 'passport-naver' {
  import { Strategy } from 'passport';

  export class Strategy extends Strategy {
    constructor(options: any, verify: any);
    authenticate(req: any, options?: any): any;
  }
}

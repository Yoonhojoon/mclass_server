// OAuth 관련 타입 정의
interface OAuthStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
  [key: string]: unknown;
}

interface OAuthVerifyFunction {
  (
    accessToken: string,
    refreshToken: string,
    profile: OAuthProfile,
    done: (error: Error | null, user?: unknown) => void
  ): void;
}

interface OAuthProfile {
  id: string;
  displayName?: string;
  username?: string;
  emails?: Array<{ value: string; type?: string }>;
  photos?: Array<{ value: string }>;
  provider: string;
  _json?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AuthenticateRequest {
  user?: unknown;
  session?: unknown;
  [key: string]: unknown;
}

declare module 'passport-kakao' {
  import { Strategy as BaseStrategy } from 'passport';

  export class Strategy extends BaseStrategy {
    constructor(options: OAuthStrategyOptions, verify: OAuthVerifyFunction);
    authenticate(
      req: AuthenticateRequest,
      options?: Record<string, unknown>
    ): unknown;
  }
}

declare module 'passport-naver' {
  import { Strategy as BaseStrategy } from 'passport';

  export class Strategy extends BaseStrategy {
    constructor(options: OAuthStrategyOptions, verify: OAuthVerifyFunction);
    authenticate(
      req: AuthenticateRequest,
      options?: Record<string, unknown>
    ): unknown;
  }
}

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

// User 타입 정의
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  isAdmin: boolean;
  provider: 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'NAVER';
  socialId?: string;
  isSignUpCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Express Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
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

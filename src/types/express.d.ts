import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    /** 인증 후 주입되는 사용자. 인증 전에는 없을 수 있음 */
    user?: AuthenticatedUser;
  }
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
  signUpCompleted: boolean;
  provider?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

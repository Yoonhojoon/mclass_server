export interface OAuthProfile {
  id: string;
  displayName?: string;
  username?: string;
  emails?: Array<{ value: string; type?: string }>;
  photos?: Array<{ value: string }>;
  provider: string;
  _json?: Record<string, unknown>;
  [key: string]: unknown;
}

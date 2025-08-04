export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'mclass-server',
  audience: process.env.JWT_AUDIENCE || 'mclass-client',
};

export type JwtConfig = typeof jwtConfig;

import cors from 'cors';
import express from 'express';
import logger from '../config/logger.config.js';

// 기본 허용 origin 목록 (스킴+호스트+포트만)
const defaultOrigins = new Set<string>([
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
]);

// 환경별 기본 origin 추가
if (process.env.NODE_ENV === 'production') {
  const productionOrigins = [
    'https://mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
    'http://mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
  ];
  productionOrigins.forEach(origin => defaultOrigins.add(origin));
}

if (process.env.NODE_ENV === 'staging') {
  const stagingOrigins = [
    'https://staging.mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
    'http://staging.mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
  ];
  stagingOrigins.forEach(origin => defaultOrigins.add(origin));
}

// 환경변수에서 추가 origin 로드
const allowedOrigins = new Set<string>(defaultOrigins);
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .forEach(o => allowedOrigins.add(o));
}

// 패턴 허용 (예: 배포 도메인 서브도메인)
const allowedPatterns = [
  /^https?:\/\/([a-z0-9-]+\.)*mclass\.com(:\d+)?$/i,
  /^https?:\/\/([a-z0-9-]+\.)*mclass-alb-616483239\.ap-northeast-2\.elb\.amazonaws\.com(:\d+)?$/i,
];

// CORS 설정 로깅
logger.info(`🔧 CORS 설정 초기화:`);
logger.info(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
logger.info(`  - 허용된 origins: ${Array.from(allowedOrigins).join(', ')}`);
logger.info(`  - 패턴: ${allowedPatterns.map(p => p.source).join(', ')}`);

const isAllowed = (origin?: string | null): boolean => {
  if (!origin) {
    logger.debug('🔍 CORS: Origin이 없음 (서버-서버 요청) - 허용');
    return true; // 서버-서버/모바일 클라이언트 허용
  }

  if (allowedOrigins.has(origin)) {
    logger.debug(`🔍 CORS: 허용된 origin - 허용: ${origin}`);
    return true;
  }

  const patternMatch = allowedPatterns.some(re => re.test(origin));
  if (patternMatch) {
    logger.debug(`🔍 CORS: 패턴 매치 - 허용: ${origin}`);
    return true;
  }

  logger.warn(`🚫 CORS: 차단된 origin: ${origin}`);
  return false;
};

// CORS 설정
export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ): void => {
    if (isAllowed(origin)) {
      return callback(null, true);
    }
    logger.warn(`🚫 CORS 차단: ${origin}`);
    return callback(new Error('CORS 정책에 의해 차단되었습니다.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Request-Id',
    'X-Forwarded-For',
    'X-Forwarded-Proto',
    'X-Forwarded-Host',
    'Accept',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['X-Request-Id'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400, // 24시간
};

// CORS 미들웨어 생성
export const corsMiddleware = cors(corsOptions);

// Vary 헤더를 추가하는 미들웨어
export const varyOriginMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  res.header('Vary', 'Origin');
  next();
};

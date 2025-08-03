import winston from 'winston';
import path from 'path';

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 로그 레벨에 따른 색상 정의
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 색상 활성화
winston.addColors(colors);

// 로그 포맷 정의
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 로그 파일 경로 설정
const logDir = path.join(process.cwd(), 'logs');

// 트랜스포트 설정
const transports = [
  // 콘솔 출력
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// 프로덕션 환경에서만 파일 로그 추가
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }) as any,

    // 전체 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }) as any
  );
}

// 로거 생성
const logger = winston.createLogger({
  level: 'debug', // 항상 debug 레벨까지 출력
  levels,
  format,
  transports,
});

// 테스트 로그 (서버 시작 시 한 번만 출력)
logger.info('🚀 Winston 로거 초기화 완료');

export default logger;

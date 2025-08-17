import Redis from 'ioredis';
import { lookup } from 'dns';

// 환경 변수 디버깅
console.log('🔍 Redis 환경 변수 확인:');
console.log('  - REDIS_URL 값:', `"${process.env.REDIS_URL}"`);
console.log(
  '  - REDIS_URL 길이:',
  process.env.REDIS_URL ? process.env.REDIS_URL.length : 0
);
console.log('  - REDIS_URL 존재 여부:', !!process.env.REDIS_URL);
console.log('  - REDIS_HOST:', process.env.REDIS_HOST || '기본값: localhost');
console.log('  - REDIS_PORT:', process.env.REDIS_PORT || '기본값: 6379');

// ElastiCache Redis 설정
const useRedisUrl =
  process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '';
console.log('  - Redis URL 사용 여부:', useRedisUrl);

const redisConfig = useRedisUrl
  ? {
      url: process.env.REDIS_URL,
      // ElastiCache 최적화 설정
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: false, // 즉시 연결 시도
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      // ElastiCache 특화 설정
      enableReadyCheck: true,
      maxLoadingTimeout: 10000,
      retryDelayOnClusterDown: 300,
      // 연결 풀 설정
      family: 4, // IPv4 강제 사용
      // DNS 해결 설정
      lookup: (hostname: string, options: any, callback: any): void => {
        console.log('🔍 DNS 조회:', hostname);
        lookup(hostname, options, callback);
      },
    }
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: false, // 즉시 연결 시도
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableReadyCheck: true,
      maxLoadingTimeout: 10000,
      retryDelayOnClusterDown: 300,
      family: 4,
    };

console.log('🔧 Redis 설정:', JSON.stringify(redisConfig, null, 2));

// Redis 클라이언트 인스턴스
const redis = new Redis(redisConfig);

// Redis 연결 이벤트 처리
redis.on('connect', () => {
  console.log('✅ Redis 연결 성공');
});

redis.on('ready', () => {
  console.log('✅ Redis 준비 완료');
});

redis.on('error', error => {
  console.error('❌ Redis 연결 오류:', error.message);
  console.error('🔍 Redis 설정 정보:');
  console.error('  - REDIS_URL:', process.env.REDIS_URL || '설정되지 않음');
  console.error('  - Redis URL 사용 여부:', useRedisUrl);
  console.error(
    '  - 연결 시도 주소:',
    error.message.includes('127.0.0.1') ? 'localhost (기본값)' : 'ElastiCache'
  );
  console.error('  - 오류 상세:', error.stack);
});

redis.on('close', () => {
  console.log('🔌 Redis 연결 종료');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis 재연결 중...');
});

redis.on('end', () => {
  console.log('🔚 Redis 연결 종료됨');
});

// Redis 클라이언트를 전역으로 관리 (개발 환경에서 핫 리로드 방지)
declare global {
  var redis: Redis | undefined;
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.redis = redis;
}

export { redis };
export default redis;

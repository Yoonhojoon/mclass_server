import Redis from 'ioredis';

// REDIS_URL이 있으면 URL을 사용하고, 없으면 개별 설정을 사용
const redisConfig = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    }
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

// Redis 클라이언트 인스턴스
const redis = new Redis(redisConfig);

// Redis 연결 이벤트 처리
redis.on('connect', () => {
  console.log('✅ Redis 연결 성공');
});

redis.on('error', error => {
  console.error('❌ Redis 연결 오류:', error);
});

redis.on('close', () => {
  console.log('🔌 Redis 연결 종료');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis 재연결 중...');
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

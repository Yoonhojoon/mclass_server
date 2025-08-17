import Redis from 'ioredis';

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

// Redis 클라이언트 인스턴스 생성
let redis: Redis;

if (useRedisUrl && process.env.REDIS_URL) {
  // REDIS_URL이 있으면 문자열로 직접 전달
  console.log('🔗 Redis URL로 연결 시도:', process.env.REDIS_URL);
  redis = new Redis(process.env.REDIS_URL, {
    // ElastiCache 최적화 설정
    maxRetriesPerRequest: 3,
    lazyConnect: false, // 즉시 연결 시도
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    // ElastiCache 특화 설정
    enableReadyCheck: true,
    // 연결 풀 설정
    family: 4, // IPv4 강제 사용
  });
} else {
  // REDIS_URL이 없으면 host/port 기반 옵션으로 연결
  console.log(
    '🔗 Host/Port로 연결 시도:',
    `${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
  );
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    lazyConnect: false, // 즉시 연결 시도
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    enableReadyCheck: true,
    family: 4,
  });
}

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

// Redis 연결 확인 함수
export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Redis 연결 상태 확인 중...');

    // 연결 상태 확인
    if (redis.status === 'ready') {
      console.log('✅ Redis 이미 연결됨');
      // PING 명령으로 실제 연결 확인
      const pong = await redis.ping();
      if (pong === 'PONG') {
        console.log('✅ Redis 연결 확인 완료 - PING 성공');
        return true;
      } else {
        console.error('❌ Redis PING 실패 - 예상: PONG, 실제:', pong);
        return false;
      }
    } else {
      console.log('🔄 Redis 연결 시도...');
      try {
        await redis.connect();
        const pong = await redis.ping();
        if (pong === 'PONG') {
          console.log('✅ Redis 연결 확인 완료 - PING 성공');
          return true;
        } else {
          console.error('❌ Redis PING 실패 - 예상: PONG, 실제:', pong);
          return false;
        }
      } catch (connectError) {
        console.error('❌ Redis 연결 실패:', connectError);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Redis 연결 확인 실패:', error);
    return false;
  }
};

// 서버 시작 시 Redis 연결 확인
export const initializeRedis = async (): Promise<void> => {
  try {
    const isConnected = await checkRedisConnection();
    if (isConnected) {
      console.log('🚀 Redis 초기화 완료');
    } else {
      console.error('❌ Redis 초기화 실패');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Redis 초기화 중 오류 발생:', error);
    process.exit(1);
  }
};

// Redis 클라이언트를 전역으로 관리 (개발 환경에서 핫 리로드 방지)
declare global {
  var redis: Redis | undefined;
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.redis = redis;
}

export { redis };
export default redis;

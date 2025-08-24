import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const enrollmentSuccessRate = new Rate('enrollment_success');
const enrollmentResponseTime = new Trend('enrollment_response_time');
const formResponseTime = new Trend('form_response_time');
const mclassResponseTime = new Trend('mclass_response_time');

// CSV 데이터 로드
const users = new SharedArray('users', function () {
  const rows = open('../artillery/artillery/users.csv')
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return rows.map((line) => {
    const [email, password, accessToken] = line
      .split(',')
      .map((s) => s.trim().replace(/\r$/, ''));
    return { email, password, accessToken };
  });
});

// 테스트 설정
export const options = {
  stages: [
    { duration: '5s', target: 10 },   // 빠른 워밍업
    { duration: '20s', target: 50 },  // 높은 부하
    { duration: '30s', target: 50 },  // 지속 부하
    { duration: '10s', target: 0 },   // 빠른 감소
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% 요청이 2초 이내 완료
    http_req_failed: ['rate<0.15'],    // 에러율 15% 미만 (409 포함)
    'enrollment_success': ['rate>0.70'], // 수강 신청 성공율 70% 이상
    'enrollment_response_time': ['p(95)<1500'],
    'form_response_time': ['p(95)<500'],
    'mclass_response_time': ['p(95)<300'],
  },
};

// 테스트 변수
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const MCLASS_ID = '11468f1b-c4ef-4fd2-9493-c7a48706c708';

// 유틸리티 함수
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateAnswers(questions) {
  if (!questions || !Array.isArray(questions)) {
    console.log(`⚠️ 신청서 질문이 없습니다. 기본 답변 사용`);
    return {
      string: `테스트 답변 ${Math.floor(Math.random() * 1000)}`
    };
  }

  const answers = {};
  questions.forEach((question, index) => {
    const questionId = question.id || `question_${index}`;
    const questionType = question.type || 'text';

    switch (questionType) {
      case 'text':
        answers[questionId] = `테스트 답변 ${Math.floor(Math.random() * 1000)}`;
        break;
      case 'string':
        answers[questionId] = `테스트 답변 ${Math.floor(Math.random() * 1000)}`;
        break;
      case 'number':
        answers[questionId] = Math.floor(Math.random() * 100);
        break;
      case 'boolean':
        answers[questionId] = Math.random() > 0.5;
        break;
      case 'select': {
        const options = question.options || ['옵션1', '옵션2', '옵션3'];
        answers[questionId] = options[Math.floor(Math.random() * options.length)];
        break;
      }
      default:
        answers[questionId] = `기본 답변 ${Math.floor(Math.random() * 1000)}`;
    }
  });

  return answers;
}

// 메인 테스트 함수
export default function () {
  const user = users[Math.floor(Math.random() * users.length)];
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.accessToken}`,
  };

  // 1. MClass 상세 정보 조회
  const mclassResponse = http.get(`${BASE_URL}/api/mclass/${MCLASS_ID}`, { headers });

  check(mclassResponse, {
    'MClass 조회 성공': (r) => r.status === 200,
    'MClass 응답 시간 < 300ms': (r) => r.timings.duration < 300,
  });

  if (mclassResponse.status !== 200) {
    errorRate.add(1);
    console.log(`❌ MClass 조회 실패: ${mclassResponse.status} - ${user.email}`);
    return;
  }

  mclassResponseTime.add(mclassResponse.timings.duration);
  console.log(`✅ MClass 조회 성공: ${user.email}`);

  sleep(0.1); // 더 빠른 간격

  // 2. 수강 신청 (고유한 멱등성 키 사용)
  const enrollmentData = {
    answers: {
      additionalProp1: `테스트 답변 1 - ${Math.floor(Math.random() * 1000)}`,
      additionalProp2: `테스트 답변 2 - ${Math.floor(Math.random() * 1000)}`,
      additionalProp3: `테스트 답변 3 - ${Math.floor(Math.random() * 1000)}`
    },
    // 고유한 멱등성 키 생성 (사용자별로 고유)
    idempotencyKey: `${user.email}-${MCLASS_ID}-${__VU}-${__ITER}`
  };

  const enrollmentResponse = http.post(
    `${BASE_URL}/api/mclasses/${MCLASS_ID}/enrollments`,
    JSON.stringify(enrollmentData),
    { headers }
  );

  check(enrollmentResponse, {
    '수강 신청 성공': (r) => r.status === 201 || r.status === 409, // 409는 이미 신청된 경우
    '신청 응답 시간 < 1500ms': (r) => r.timings.duration < 1500,
  });

  if (enrollmentResponse.status === 201) {
    enrollmentSuccessRate.add(1);
    console.log(`✅ 수강 신청 성공: ${user.email} -> ${MCLASS_ID}`);
  } else if (enrollmentResponse.status === 409) {
    // 409는 정상적인 비즈니스 로직이므로 에러로 카운트하지 않음
    console.log(`ℹ️ 이미 신청된 클래스: ${user.email} -> ${MCLASS_ID}`);
  } else {
    errorRate.add(1);
    console.log(`❌ 수강 신청 실패: ${enrollmentResponse.status} - ${user.email}`);

    // 에러 응답 내용 출력
    try {
      const errorData = JSON.parse(enrollmentResponse.body);
      console.log(`   에러 내용: ${JSON.stringify(errorData)}`);
    } catch (e) {
      console.log(`   에러 내용: ${enrollmentResponse.body}`);
    }
  }

  enrollmentResponseTime.add(enrollmentResponse.timings.duration);

  // 요청 간 간격 (더 빠르게)
  sleep(0.2);
}

// 테스트 시작 시 로그
export function setup() {
  console.log(`🚀 수강 신청 전용 k6 테스트 시작`);
  console.log(`📊 총 테스트 사용자 수: ${users.length}`);
  console.log(`🌐 대상 URL: ${BASE_URL}`);
  console.log(`🎯 대상 MClass ID: ${MCLASS_ID}`);
  console.log(`⏱️ 테스트 단계: ${JSON.stringify(options.stages)}`);

  return {
    userCount: users.length,
    baseUrl: BASE_URL,
    mclassId: MCLASS_ID,
  };
}

// 테스트 완료 시 로그
export function teardown(data) {
  console.log(`✅ 수강 신청 전용 k6 테스트 완료`);
  console.log(`📈 테스트된 사용자 수: ${data.userCount}`);
  console.log(`🎯 대상 MClass ID: ${data.mclassId}`);
}

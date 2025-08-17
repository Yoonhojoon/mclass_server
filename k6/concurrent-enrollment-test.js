import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const enrollmentResponseTime = new Trend('enrollment_response_time');
const mclassResponseTime = new Trend('mclass_response_time');
const formResponseTime = new Trend('form_response_time');

// CSV 데이터 로드
const users = new SharedArray('users', function () {
  return open('../artillery/users.csv').split('\n').slice(1).map(line => {
    const [email, password, accessToken] = line.split(',');
    return { email, password, accessToken };
  });
});

// 테스트 설정
export const options = {
  stages: [
    { duration: '5s', target: 1 },    // Warm up
    { duration: '12s', target: 12 },  // Peak 12 rps - 동시 신청
    { duration: '8s', target: 6 },    // Sustain 6 rps
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // error rate must be less than 10%
    'enrollment_response_time': ['p(95)<300'], // 신청 응답 시간
    'mclass_response_time': ['p(95)<100'],     // 클래스 조회 응답 시간
    'form_response_time': ['p(95)<100'],       // 신청서 조회 응답 시간
  },
};

// 테스트 변수
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const MCLASS_ID = __ENV.MCLASS_ID || 'b21c86a0-383a-4d46-9376-fcf246028d13';

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
    console.warn('⚠️ 신청서 질문이 없습니다. 기본 답변 사용');
    return {
      string: `테스트 답변 ${Math.floor(Math.random() * 1000)}`
    };
  }

  const answers = {};
  questions.forEach((question, index) => {
    const questionId = question.id || `question_${index}`;
    const questionType = question.type || 'string';

    switch (questionType) {
      case 'string':
        answers[questionId] = `테스트 답변 ${Math.floor(Math.random() * 1000)}`;
        break;
      case 'number':
        answers[questionId] = Math.floor(Math.random() * 100);
        break;
      case 'boolean':
        answers[questionId] = Math.random() > 0.5;
        break;
      case 'select':
        const options = question.options || ['옵션1', '옵션2', '옵션3'];
        answers[questionId] = options[Math.floor(Math.random() * options.length)];
        break;
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

  // 1) 클래스 조회
  const mclassStart = Date.now();
  const mclassResponse = http.get(`${BASE_URL}/api/mclass/${MCLASS_ID}`, { headers });
  const mclassDuration = Date.now() - mclassStart;
  mclassResponseTime.add(mclassDuration);

  const mclassCheck = check(mclassResponse, {
    '클래스 조회 성공': (r) => r.status === 200,
    '클래스 조회 응답 시간 < 100ms': (r) => r.timings.duration < 100,
  });

  if (!mclassCheck) {
    console.error(`❌ 클래스 조회 실패: ${mclassResponse.status} - ${mclassResponse.body}`);
    errorRate.add(1);
  }

  // 2) 신청서 양식 조회
  const formStart = Date.now();
  const formResponse = http.get(`${BASE_URL}/api/mclasses/${MCLASS_ID}/enrollment-form`, { headers });
  const formDuration = Date.now() - formStart;
  formResponseTime.add(formDuration);

  const formCheck = check(formResponse, {
    '신청서 양식 조회 성공': (r) => r.status === 200,
    '신청서 양식 조회 응답 시간 < 100ms': (r) => r.timings.duration < 100,
  });

  if (!formCheck) {
    console.error(`❌ 신청서 양식 조회 실패: ${formResponse.status} - ${formResponse.body}`);
    errorRate.add(1);
  }

  // 3) 동적 답변 생성
  let enrollmentQuestions = [];
  try {
    const formData = JSON.parse(formResponse.body);
    enrollmentQuestions = formData.data?.questions || [];
  } catch (e) {
    console.warn('⚠️ 신청서 양식 파싱 실패, 기본 답변 사용');
  }

  const dynamicAnswers = generateAnswers(enrollmentQuestions);

  // 4) 클래스 신청 (동적 답변 사용)
  const enrollmentStart = Date.now();
  const enrollmentPayload = {
    answers: dynamicAnswers,
    idempotencyKey: generateUUID(),
  };

  const enrollmentResponse = http.post(
    `${BASE_URL}/api/mclasses/${MCLASS_ID}/enrollments`,
    JSON.stringify(enrollmentPayload),
    { headers }
  );
  const enrollmentDuration = Date.now() - enrollmentStart;
  enrollmentResponseTime.add(enrollmentDuration);

  const enrollmentCheck = check(enrollmentResponse, {
    '신청 성공 (201)': (r) => r.status === 201,
    '중복 신청 처리 (409)': (r) => r.status === 409,
    '신청 응답 시간 < 500ms': (r) => r.timings.duration < 500,
    '응답이 JSON 형식': (r) => r.headers['Content-Type']?.includes('application/json'),
  });

  if (!enrollmentCheck) {
    console.error(`❌ 신청 실패: ${enrollmentResponse.status} - ${enrollmentResponse.body}`);
    errorRate.add(1);
  } else {
    // 성공적인 신청의 경우 데이터 정합성 검증
    if (enrollmentResponse.status === 201) {
      try {
        const data = JSON.parse(enrollmentResponse.body);
        const dataValidation = check(data, {
          '신청 ID 존재': (d) => d.data?.id,
          '클래스 ID 일치': (d) => d.data?.mclassId === MCLASS_ID,
          '상태값 유효': (d) => ['APPLIED', 'APPROVED', 'WAITLISTED'].includes(d.data?.status),
        });

        if (!dataValidation) {
          console.error('❌ 데이터 정합성 검증 실패:', data);
        } else {
          console.log(`✅ 신청 성공: ${data.data?.id} (${data.data?.status})`);
        }
      } catch (e) {
        console.error('❌ 응답 JSON 파싱 실패:', e.message);
      }
    } else if (enrollmentResponse.status === 409) {
      console.log('ℹ️ 중복 신청 감지 (정상적인 멱등성 처리)');
    }
  }

  // 응답 시간 분석
  if (enrollmentDuration > 500) {
    console.warn(`⚠️ 느린 신청 응답: ${enrollmentDuration}ms`);
  }

  // 동시성 관측
  const now = Date.now();
  if (now % 1000 < 100) { // 1초마다 한 번씩
    console.log(`📊 현재 동시 요청 처리 중... (${enrollmentDuration}ms)`);
  }

  // 요청 간격
  sleep(1);
}

// 테스트 완료 후 요약
export function handleSummary(data) {
  console.log('\n📊 동시 Enrollment 테스트 요약');
  console.log('================================');
  console.log(`총 요청 수: ${data.metrics.http_reqs.values.count}`);
  console.log(`성공 (2xx): ${data.metrics.http_req_duration.values.count - (data.metrics.http_req_failed.values.rate * data.metrics.http_reqs.values.count)}`);
  console.log(`실패 (5xx): ${data.metrics.http_req_failed.values.rate * data.metrics.http_reqs.values.count}`);
  console.log(`에러율: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);

  if (data.metrics.enrollment_response_time) {
    console.log(`신청 응답 시간 - 평균: ${data.metrics.enrollment_response_time.values.avg.toFixed(2)}ms, P95: ${data.metrics.enrollment_response_time.values['p(95)'].toFixed(2)}ms`);
  }

  if (data.metrics.mclass_response_time) {
    console.log(`클래스 조회 응답 시간 - 평균: ${data.metrics.mclass_response_time.values.avg.toFixed(2)}ms, P95: ${data.metrics.mclass_response_time.values['p(95)'].toFixed(2)}ms`);
  }

  return {
    'stdout': JSON.stringify(data, null, 2),
    [`k6-report-${Date.now()}.json`]: JSON.stringify(data, null, 2),
  };
}

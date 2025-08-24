import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const enrollmentSuccessRate = new Rate('enrollment_success');
const enrollmentResponseTime = new Trend('enrollment_response_time');
const formResponseTime = new Trend('form_response_time');
const mclassResponseTime = new Trend('mclass_response_time');

// 관리자 토큰
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZTM0M2UwMi1hYTdmLTRjYjgtOTEyZS02NTkwMzFjZjg4MjAiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaXNBZG1pbiI6dHJ1ZSwic2lnblVwQ29tcGxldGVkIjp0cnVlLCJpYXQiOjE3NTU5NjUyNDYsImV4cCI6MTc1NjA1MTY0NiwiYXVkIjoibWNsYXNzLWNsaWVudCIsImlzcyI6Im1jbGFzcy1zZXJ2ZXIifQ.cAcRKVS7TQ8p-39ZYj0-UsHRIDsmPpbFmSBi8EfSz9E';

// 테스트 설정
export const options = {
  stages: [
    { duration: '10s', target: 5 },    // 워밍업
    { duration: '30s', target: 15 },   // 부하 증가
    { duration: '60s', target: 15 },   // 지속 부하
    { duration: '20s', target: 0 },    // 점진적 감소
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% 요청이 2초 이내 완료
    http_req_failed: ['rate<0.05'],    // 에러율 5% 미만
    'enrollment_success': ['rate>0.90'], // 수강 신청 성공율 90% 이상
    'enrollment_response_time': ['p(95)<1500'],
    'form_response_time': ['p(95)<500'],
    'mclass_response_time': ['p(95)<300'],
  },
};

// 테스트 변수
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const MCLASS_ID = '6390cd1c-6514-4a19-9224-0d89c17a54d3';

// 유틸리티 함수
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
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
  };

  // 1. MClass 상세 정보 조회
  const mclassResponse = http.get(`${BASE_URL}/api/mclass/${MCLASS_ID}`, { headers });

  check(mclassResponse, {
    'MClass 조회 성공': (r) => r.status === 200,
    'MClass 응답 시간 < 300ms': (r) => r.timings.duration < 300,
  });

  if (mclassResponse.status !== 200) {
    errorRate.add(1);
    console.log(`❌ MClass 조회 실패: ${mclassResponse.status}`);
    return;
  }

  mclassResponseTime.add(mclassResponse.timings.duration);
  console.log(`✅ MClass 조회 성공`);

  sleep(0.3);

  // 2. 수강 신청서 조회
  const formResponse = http.get(`${BASE_URL}/api/mclasses/${MCLASS_ID}/enrollment-form`, { headers });

  check(formResponse, {
    '수강 신청서 조회 성공': (r) => r.status === 200,
    '신청서 응답 시간 < 500ms': (r) => r.timings.duration < 500,
  });

  if (formResponse.status !== 200) {
    errorRate.add(1);
    console.log(`❌ 신청서 조회 실패: ${formResponse.status}`);
    return;
  }

  formResponseTime.add(formResponse.timings.duration);

  // 신청서 데이터 파싱
  let formData = null;
  try {
    const formResponseData = JSON.parse(formResponse.body);
    if (formResponseData.data) {
      formData = formResponseData.data;
      console.log(`✅ 신청서 조회 성공 - 질문 수: ${formData.questions ? formData.questions.length : 0}`);
    } else {
      console.log(`⚠️ 신청서 데이터가 없습니다`);
      return;
    }
  } catch (e) {
    console.log(`⚠️ 신청서 데이터 파싱 실패: ${e.message}`);
    return;
  }

  sleep(0.2);

  // 3. 수강 신청
  const enrollmentData = {
    mclassId: MCLASS_ID,
    enrollmentFormId: formData.id,
    answers: generateAnswers(formData.questions),
  };

  const enrollmentResponse = http.post(
    `${BASE_URL}/api/enrollments`,
    JSON.stringify(enrollmentData),
    { headers }
  );

  check(enrollmentResponse, {
    '수강 신청 성공': (r) => r.status === 201 || r.status === 409, // 409는 이미 신청된 경우
    '신청 응답 시간 < 1500ms': (r) => r.timings.duration < 1500,
  });

  if (enrollmentResponse.status === 201) {
    enrollmentSuccessRate.add(1);
    console.log(`✅ 수강 신청 성공 -> ${MCLASS_ID}`);
  } else if (enrollmentResponse.status === 409) {
    console.log(`ℹ️ 이미 신청된 클래스 -> ${MCLASS_ID}`);
  } else {
    errorRate.add(1);
    console.log(`❌ 수강 신청 실패: ${enrollmentResponse.status}`);

    // 에러 응답 내용 출력
    try {
      const errorData = JSON.parse(enrollmentResponse.body);
      console.log(`   에러 내용: ${JSON.stringify(errorData)}`);
    } catch (e) {
      console.log(`   에러 내용: ${enrollmentResponse.body}`);
    }
  }

  enrollmentResponseTime.add(enrollmentResponse.timings.duration);

  sleep(0.5);

  // 4. 내 수강 신청 목록 조회 (확인용)
  const myEnrollmentsResponse = http.get(`${BASE_URL}/api/enrollments`, { headers });

  check(myEnrollmentsResponse, {
    '내 신청 목록 조회 성공': (r) => r.status === 200,
    '목록 응답 시간 < 500ms': (r) => r.timings.duration < 500,
  });

  if (myEnrollmentsResponse.status !== 200) {
    errorRate.add(1);
    console.log(`❌ 내 신청 목록 조회 실패: ${myEnrollmentsResponse.status}`);
  }

  // 요청 간 간격
  sleep(1);
}

// 테스트 시작 시 로그
export function setup() {
  console.log(`🚀 관리자 수강 신청 전용 k6 테스트 시작`);
  console.log(`🌐 대상 URL: ${BASE_URL}`);
  console.log(`🎯 대상 MClass ID: ${MCLASS_ID}`);
  console.log(`👤 관리자 토큰 사용`);
  console.log(`⏱️ 테스트 단계: ${JSON.stringify(options.stages)}`);

  return {
    baseUrl: BASE_URL,
    mclassId: MCLASS_ID,
  };
}

// 테스트 완료 시 로그
export function teardown(data) {
  console.log(`✅ 관리자 수강 신청 전용 k6 테스트 완료`);
  console.log(`🎯 대상 MClass ID: ${data.mclassId}`);
}


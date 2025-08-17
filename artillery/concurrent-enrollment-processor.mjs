/**
 * 동시 Enrollment 테스트 프로세서 (ESM)
 * - CSV에서 읽어온 사용자 정보로 동시 신청 테스트
 */

// 유틸: UUID/랜덤 문자열
function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function randomString(n = 10) {
  return Math.random().toString(36).slice(2, 2 + n);
}

/** 동적 답변 생성 */
export function generateAnswers(context, events, done) {
  const questions = context.vars.enrollmentQuestions;
  if (!questions || !Array.isArray(questions)) {
    console.warn('⚠️ 신청서 질문이 없습니다. 기본 답변 사용');
    context.vars.dynamicAnswers = {
      string: `테스트 답변 ${Math.floor(Math.random() * 1000)}`
    };
    return done();
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
      case 'select': {
        const options = question.options || ['옵션1', '옵션2', '옵션3'];
        answers[questionId] = options[Math.floor(Math.random() * options.length)];
        break;
      }
      default:
        answers[questionId] = `기본 답변 ${Math.floor(Math.random() * 1000)}`;
    }
  });

  context.vars.dynamicAnswers = answers;
  done();
}

/** 응답 시간 분석 */
export function analyzeResponseTime(requestParams, response, context, ee, next) {
  const firstByte = response?.timings?.phases?.firstByte ?? 0;
  const sc = response?.statusCode ?? -1;

  context.vars.responseTimes ||= [];
  context.vars.responseTimes.push(firstByte);

  context.vars.statusCodes ||= {};
  context.vars.statusCodes[sc] = (context.vars.statusCodes[sc] || 0) + 1;

  if (firstByte > 5000) {
    console.warn(`⚠️ 느린 응답: ${firstByte}ms - ${requestParams?.url}`);
  }
  return next();
}

/** 동시성 관측 */
export function validateConcurrency(requestParams, response, context, ee, next) {
  const now = Date.now();
  context.vars.requestStartTimes ||= [];
  context.vars.requestStartTimes.push(now);

  const oneSecAgo = now - 1000;
  context.vars.requestStartTimes = context.vars.requestStartTimes.filter(t => t > oneSecAgo);
  context.vars.concurrentRequests = context.vars.requestStartTimes.length;

  if (context.vars.concurrentRequests > 50) {
    console.warn(`⚠️ 높은 동시 요청 수: ${context.vars.concurrentRequests}`);
  }
  return next();
}

/** 데이터 정합성 검증 */
export function validateDataConsistency(requestParams, response, context, ee, next) {
  try {
    const data = JSON.parse(response.body ?? '{}');
    if (data.status) {
      const valid = ['APPLIED', 'APPROVED', 'WAITLISTED', 'REJECTED', 'CANCELED'];
      if (!valid.includes(data.status)) {
        console.error(`❌ 잘못된 상태값: ${data.status}`);
      }
    }
    if (data.id && data.mclassId && data.userId) {
      console.log(`✅ 정합성 OK: ${data.id} (${data.status || 'N/A'})`);
    } else {
      console.error('❌ 필수 필드 누락');
    }
  } catch (e) {
    console.error('❌ JSON 파싱 오류:', e?.message);
  }
  return next();
}

/** 에러 수집 */
export function handleErrors(requestParams, response, context, ee, next) {
  const sc = response?.statusCode ?? 0;
  if (sc >= 400) {
    console.error(`❌ HTTP ${sc}: ${requestParams?.url}`);
    console.error(`본문: ${response?.body}`);
    context.vars.errors ||= [];
    context.vars.errors.push({
      statusCode: sc,
      url: requestParams?.url,
      body: response?.body
    });
  }
  return next();
}

/** 테스트 요약 생성 */
export function generateTestSummary(context, events, done) {
  const responseTimes = context.vars.responseTimes || [];
  const statusCodes = context.vars.statusCodes || {};
  const errors = context.vars.errors || [];

  console.log('\n📊 동시 Enrollment 테스트 요약');
  console.log('================================');
  console.log(`총 요청 수: ${responseTimes.length}`);
  console.log(`성공 (2xx): ${(statusCodes[200] || 0) + (statusCodes[201] || 0)}`);
  console.log(`실패 (5xx): ${statusCodes[500] || 0}`);
  console.log(`에러 수: ${errors.length}`);

  if (responseTimes.length > 0) {
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);
    console.log(`응답 시간 - 평균: ${avg.toFixed(2)}ms, 최소: ${min}ms, 최대: ${max}ms`);
  }

  if (errors.length > 0) {
    console.log('\n❌ 주요 에러:');
    errors.slice(0, 5).forEach((error, index) => {
      console.log(`${index + 1}. ${error.statusCode} - ${error.url}`);
    });
  }

  done();
}


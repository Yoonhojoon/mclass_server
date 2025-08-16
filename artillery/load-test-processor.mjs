/**
 * Artillery 부하 테스트 프로세서 (ESM)
 * - 동시성/정합성 검증 및 메트릭 수집 훅
 * - VU(가상 사용자)별 계정 초기화 헬퍼 포함
 */

// 유틸: UUID/랜덤 문자열
function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
function randomString(n = 10) {
  return Math.random().toString(36).slice(2, 2 + n);
}

/** VU별 계정 초기화 (시나리오 첫 단계에서 호출 권장) */
export function initUser(context, events, done) {
  const id = genId();
  context.vars.email = `${id}@test.com`;
  context.vars.password = 'password123';
  context.vars.displayName = `user_${randomString(6)}`;
  done();
}

/** 멱등성 검증: 동일 사용자 다중 요청이 동일 결과를 내는지 */
export function validateIdempotency(requestParams, context, ee, next) {
  const { enrollmentId1, enrollmentId2, enrollmentId3 } = context.vars;
  if (enrollmentId1 && enrollmentId2 && enrollmentId3) {
    if (enrollmentId1 === enrollmentId2 && enrollmentId2 === enrollmentId3) {
      console.log('✅ 멱등성 검증 성공: 동일 ID');
    } else {
      console.error('❌ 멱등성 검증 실패:', enrollmentId1, enrollmentId2, enrollmentId3);
    }
  }
  return next();
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

/** 동시성 관측(간단 추정) */
export function validateConcurrency(requestParams, response, context, ee, next) {
  const now = Date.now();
  context.vars.requestStartTimes ||= [];
  context.vars.requestStartTimes.push(now);

  const oneSecAgo = now - 1000;
  context.vars.requestStartTimes = context.vars.requestStartTimes.filter(t => t > oneSecAgo);
  context.vars.concurrentRequests = context.vars.requestStartTimes.length;

  if (context.vars.concurrentRequests > 100) {
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
      // 필요 시 마지막 신청 ID를 멱등성 검증용으로 저장
      context.vars.enrollmentId1 ??= data.id;
      console.log(`✅ 정합성 OK: ${data.id}`);
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
      body: response?.body,
      ts: new Date().toISOString(),
    });
  }
  return next();
}

/** 메트릭 수집 */
export function collectMetrics(requestParams, response, context, ee, next) {
  try {
    const metrics = {
      ts: Date.now(),
      url: requestParams?.url,
      method: requestParams?.method,
      statusCode: response?.statusCode,
      responseTime: response?.timings?.phases?.firstByte ?? 0,
      contentLength: response?.headers?.['content-length'] || 0,
    };
    context.vars.metrics ||= [];
    context.vars.metrics.push(metrics);
  } catch (error) {
    console.error('메트릭 수집 오류:', error?.message);
  }
  return next();
}

/** 동적 답변 생성 (신청서 양식 기반) */
export function generateAnswers(context, events, done) {
  try {
    const questions = context.vars.enrollmentQuestions || [];
    const answers = {};

    console.log('🔍 질문 구조 확인:', JSON.stringify(questions, null, 2));

    // 기본 답변 템플릿 (질문이 없는 경우 사용)
    const defaultAnswers = {
      string: `테스트 답변 ${Math.floor(Math.random() * 1000)}`
    };

    if (questions && questions.length > 0) {
      // 실제 질문 구조를 기반으로 답변 생성
      questions.forEach(question => {
        const questionId = question.id;

        switch (question.type) {
          case 'text':
          case 'email':
          case 'phone':
          case 'date':
          case 'textarea':
            answers[questionId] = `테스트 답변 ${Math.floor(Math.random() * 1000)}`;
            break;

          case 'radio':
          case 'select':
            if (question.options && question.options.length > 0) {
              answers[questionId] = question.options[Math.floor(Math.random() * question.options.length)];
            } else {
              answers[questionId] = 'intermediate';
            }
            break;

          case 'checkbox':
            if (question.options && question.options.length > 0) {
              const selectedCount = Math.floor(Math.random() * question.options.length) + 1;
              answers[questionId] = question.options.slice(0, selectedCount);
            } else {
              answers[questionId] = ['javascript', 'react'];
            }
            break;

          case 'agreeTerms':
            answers[questionId] = true;
            break;

          default:
            answers[questionId] = `기본 답변 ${Math.floor(Math.random() * 1000)}`;
        }
      });
    } else {
      // 기본 답변 사용
      Object.assign(answers, defaultAnswers);
      console.log('⚠️ 질문이 없어서 기본 답변 사용');
    }

    context.vars.dynamicAnswers = answers;
    console.log(`✅ 동적 답변 생성 완료: ${Object.keys(answers).length}개 질문`);
    console.log('📝 생성된 답변:', JSON.stringify(answers, null, 2));
  } catch (error) {
    console.error('❌ 동적 답변 생성 오류:', error?.message);
    // 오류 발생 시 기본 답변 사용
    context.vars.dynamicAnswers = {
      string: `테스트 답변 ${Math.floor(Math.random() * 1000)}`
    };
  }
  done();
}

/** 테스트 요약 출력 (after 섹션에서 호출) */
export function generateTestSummary(context, ee, next) {
  console.log('\n📊 테스트 결과 요약');
  console.log('==================');
  const times = context.vars.responseTimes || [];
  if (times.length) {
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(`응답시간 - 평균: ${avg.toFixed(2)}ms, 최소: ${min}ms, 최대: ${max}ms`);
  }
  const codes = context.vars.statusCodes || {};
  if (Object.keys(codes).length) {
    console.log('상태 코드 분포:');
    for (const [k, v] of Object.entries(codes)) console.log(`  ${k}: ${v}회`);
  }
  if (typeof context.vars.concurrentRequests !== 'undefined') {
    console.log(`최대 동시 요청(추정): ${context.vars.concurrentRequests}`);
  }
  const errs = context.vars.errors || [];
  if (errs.length) {
    console.log(`오류 총계: ${errs.length}건 (샘플 3건)`);
    errs.slice(0, 3).forEach(e => console.log(`- ${e.statusCode} ${e.url}`));
  }
  return next();
}

export default {
  initUser,
  validateIdempotency,
  analyzeResponseTime,
  validateConcurrency,
  validateDataConsistency,
  generateTestSummary,
  handleErrors,
  collectMetrics,
  generateAnswers,
};

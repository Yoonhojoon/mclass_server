const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

// 유틸: UUID/랜덤 문자열
function genId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function randomString(n = 10) {
  return Math.random().toString(36).slice(2, 2 + n);
}

// HTTP 요청 헬퍼 함수
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error('JSON 파싱 실패'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 3단계 회원가입 프로세스
async function completeUserRegistration(email, password, name) {
  try {
    // 1단계: 회원가입
    const registerOptions = {
      hostname: 'mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
      port: 80,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const registerData = {
      email,
      password,
      name
    };

    const registerResponse = await makeRequest(registerOptions, registerData);

    if (!registerResponse.success) {
      throw new Error(`회원가입 실패: ${registerResponse.message || '알 수 없는 오류'}`);
    }

    // 2단계: 로그인하여 임시 토큰 획득
    const loginOptions = {
      hostname: 'mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
      port: 80,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginData = {
      email,
      password
    };

    const loginResponse = await makeRequest(loginOptions, loginData);

    if (!loginResponse.success || !loginResponse.data.accessToken) {
      throw new Error(`로그인 실패: ${loginResponse.message || '토큰을 받을 수 없습니다'}`);
    }

    const tempToken = loginResponse.data.accessToken;

    // 3단계: 회원가입 완료 (약관 동의)
    const completeOptions = {
      hostname: 'mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
      port: 80,
      path: '/api/auth/complete-signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempToken}`
      }
    };

    const completeData = {
      termIds: ["57d7b9cd-21d2-40dc-b64f-991c11852955"] // 약관 ID
    };

    const completeResponse = await makeRequest(completeOptions, completeData);

    if (!completeResponse.success || !completeResponse.data.accessToken) {
      throw new Error(`회원가입 완료 실패: ${completeResponse.message || '최종 토큰을 받을 수 없습니다'}`);
    }

    return completeResponse.data.accessToken;

  } catch (error) {
    console.error(`회원가입 프로세스 실패 (${email}):`, error.message);
    return null;
  }
}

async function generateUsers(count = 300) {
  console.log(`🔄 ${count}명의 사용자 생성 시작...`);

  const users = [];

  for (let i = 0; i < count; i++) {
    const id = genId();
    const email = `${id}@test.com`;
    const password = 'password123';
    const name = `user_${randomString(6)}`;

    try {
      // 3단계 회원가입 프로세스를 통해 사용자 생성 및 최종 토큰 획득
      const accessToken = await completeUserRegistration(email, password, name);

      if (accessToken) {
        users.push({
          email: email,
          password: password,
          accessToken: accessToken
        });

        if ((i + 1) % 10 === 0) {
          console.log(`✅ ${i + 1}/${count} 사용자 생성 완료`);
        }
      } else {
        console.warn(`⚠️ 회원가입 실패로 사용자 ${email} 제외`);
      }

    } catch (error) {
      console.error(`❌ 사용자 생성 실패 (${i + 1}번째):`, error.message);
    }
  }

  // CSV 파일로 저장
  const csvHeader = 'email,password,accessToken\n';
  const csvContent = users.map(user =>
    `${user.email},${user.password},${user.accessToken}`
  ).join('\n');

  const csvData = csvHeader + csvContent;
  fs.mkdirSync('./artillery', { recursive: true });
  fs.writeFileSync('./artillery/users.csv', csvData);

  console.log(`🎉 ${users.length}명의 사용자 생성 완료!`);
  console.log(`📁 CSV 파일 저장: ./artillery/users.csv`);
  return users;
}

// 스크립트 실행
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 300;

  generateUsers(count)
    .then(() => {
      console.log('✅ 사용자 생성 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { generateUsers };

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MClass Server API',
      version: '1.0.0',
      description: 'MClass 서버 API 문서',
      contact: {
        name: 'API Support',
        email: 'support@mclass.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '개발 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰을 입력하세요. 예: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '사용자 ID',
            },
            email: {
              type: 'string',
              description: '사용자 이메일',
            },
            name: {
              type: 'string',
              description: '사용자 이름',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: '사용자 역할',
            },
            is_admin: {
              type: 'boolean',
              description: '관리자 여부',
            },
            provider: {
              type: 'string',
              enum: ['LOCAL', 'KAKAO', 'GOOGLE', 'NAVER'],
              description: '로그인 제공자',
            },
            social_id: {
              type: 'string',
              description: '소셜 로그인 ID',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
          },
        },
        MClass: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '클래스 ID',
            },
            title: {
              type: 'string',
              description: '클래스 제목',
            },
            description: {
              type: 'string',
              description: '클래스 설명',
            },
            capacity: {
              type: 'integer',
              description: '수용 인원',
            },
            start_at: {
              type: 'string',
              format: 'date-time',
              description: '시작일시',
            },
            end_at: {
              type: 'string',
              format: 'date-time',
              description: '종료일시',
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              description: '생성자 ID',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
          },
        },
        Term: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '약관 ID',
            },
            type: {
              type: 'string',
              enum: ['SERVICE', 'PRIVACY', 'ENROLLMENT'],
              description: '약관 유형',
            },
            title: {
              type: 'string',
              description: '약관 제목',
            },
            content: {
              type: 'string',
              description: '약관 내용',
            },
            is_required: {
              type: 'boolean',
              description: '필수 동의 여부',
            },
            version: {
              type: 'string',
              description: '약관 버전',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '수강신청 ID',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: '사용자 ID',
            },
            mclass_id: {
              type: 'string',
              format: 'uuid',
              description: '클래스 ID',
            },
            applied_at: {
              type: 'string',
              format: 'date-time',
              description: '신청일시',
            },
          },
        },
        EnrollmentForm: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '신청서 ID',
            },
            phone: {
              type: 'string',
              description: '전화번호',
            },
            birth_date: {
              type: 'string',
              format: 'date',
              description: '생년월일',
            },
            gender: {
              type: 'string',
              enum: ['M', 'F'],
              description: '성별',
            },
            is_student: {
              type: 'boolean',
              description: '학생 여부',
            },
            school_name: {
              type: 'string',
              description: '학교명',
            },
            major: {
              type: 'string',
              description: '전공',
            },
            address: {
              type: 'string',
              description: '주소',
            },
            available_time: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '가능한 시간대',
            },
            support_reason: {
              type: 'string',
              description: '지원 이유',
            },
            wanted_activity: {
              type: 'string',
              description: '희망 활동',
            },
            experience: {
              type: 'string',
              description: '경험',
            },
            introduce: {
              type: 'string',
              description: '자기소개',
            },
            agree_terms: {
              type: 'boolean',
              description: '약관 동의 여부',
            },
          },
        },
        UserTermAgreement: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '동의 기록 ID',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: '사용자 ID',
            },
            term_id: {
              type: 'string',
              format: 'uuid',
              description: '약관 ID',
            },
            agreed_at: {
              type: 'string',
              format: 'date-time',
              description: '동의일시',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '에러 메시지',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/*.routes.ts', './src/index.ts'], // API 라우트 파일들
};

export const specs = swaggerJsdoc(options);

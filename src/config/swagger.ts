import swaggerJsdoc from 'swagger-jsdoc';

const isDevelopment = process.env.NODE_ENV === 'development';

// 디버깅을 위한 로그
console.log('🔍 Swagger 설정 - 환경:', process.env.NODE_ENV);
console.log('🔍 Swagger 설정 - isDevelopment:', isDevelopment);

const apiPaths = isDevelopment
  ? ['./src/routes/*.ts', './src/routes/*.routes.ts', './src/index.ts']
  : ['./dist/routes/*.js', './dist/routes/*.routes.js', './dist/index.js'];

console.log('🔍 Swagger 설정 - API 경로:', apiPaths);

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
        description: '로컬 개발 서버',
      },
      {
        url: 'https://mclass-alb-616483239.ap-northeast-2.elb.amazonaws.com',
        description: '프로덕션 서버',
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
            isAdmin: {
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
        UpdateRoleRequest: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: '사용자 역할',
            },
            isAdmin: {
              type: 'boolean',
              description: '관리자 여부',
            },
            reason: {
              type: 'string',
              description: '권한 변경 사유 (선택사항)',
            },
          },
          required: ['role', 'isAdmin'],
        },
        UserRole: {
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
            isAdmin: {
              type: 'boolean',
              description: '관리자 여부',
            },
            isSignUpCompleted: {
              type: 'boolean',
              description: '회원가입 완료 여부',
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
            userId: {
              type: 'string',
              format: 'uuid',
              description: '사용자 ID',
            },
            termId: {
              type: 'string',
              format: 'uuid',
              description: '약관 ID',
            },
            agreedAt: {
              type: 'string',
              format: 'date-time',
              description: '동의일시',
            },
          },
        },
        // 공통 응답 스키마
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
              description: '성공 여부',
            },
            data: {
              description: '응답 데이터',
            },
            message: {
              type: 'string',
              description: '성공 메시지',
            },
          },
          required: ['success', 'data'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
              description: '성공 여부',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: '에러 코드',
                },
                message: {
                  type: 'string',
                  description: '에러 메시지',
                },
                details: {
                  description: '상세 에러 정보',
                },
              },
              required: ['code', 'message'],
            },
          },
          required: ['success', 'error'],
        },
        // 공통 에러 스키마 (기존 Error 참조를 위한 별칭)
        Error: {
          $ref: '#/components/schemas/ErrorResponse',
        },
        // 인증 관련 응답
        AuthLoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                accessToken: {
                  type: 'string',
                  description: '액세스 토큰',
                },
                refreshToken: {
                  type: 'string',
                  description: '리프레시 토큰',
                },
              },
            },
            message: {
              type: 'string',
              example:
                '로그인이 성공적으로 완료되었습니다. (사용자 ID: user123, 역할: USER)',
            },
          },
        },
        AuthLogoutResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'null',
            },
            message: {
              type: 'string',
              example: '로그아웃이 성공적으로 완료되었습니다.',
            },
          },
        },
        // 약관 관련 응답
        TermListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Term',
              },
            },
            message: {
              type: 'string',
              example: '약관 목록이 성공적으로 조회되었습니다.',
            },
          },
        },
        TermResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              $ref: '#/components/schemas/Term',
            },
            message: {
              type: 'string',
              example: '약관이 성공적으로 조회되었습니다.',
            },
          },
        },
        // 에러 응답들
        AuthError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  enum: [
                    'INVALID_CREDENTIALS',
                    'AUTHENTICATION_FAILED',
                    'SESSION_EXPIRED',
                    'TOO_MANY_LOGIN_ATTEMPTS',
                  ],
                  example: 'INVALID_CREDENTIALS',
                },
                message: {
                  type: 'string',
                  example: '이메일 또는 비밀번호가 올바르지 않습니다.',
                },
              },
            },
          },
        },
        // AuthError 클래스의 각 static 함수별 에러 스키마
        AuthInvalidCredentialsError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'INVALID_CREDENTIALS',
                },
                message: {
                  type: 'string',
                  example: '이메일 또는 비밀번호가 올바르지 않습니다.',
                },
              },
            },
          },
        },
        AuthAuthenticationFailedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'AUTHENTICATION_FAILED',
                },
                message: {
                  type: 'string',
                  example: '인증에 실패했습니다.',
                },
              },
            },
          },
        },
        AuthPermissionDeniedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'PERMISSION_DENIED',
                },
                message: {
                  type: 'string',
                  example: '{resource}에 대한 {action} 권한이 없습니다.',
                },
              },
            },
          },
        },
        AuthRoleInsufficientError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ROLE_INSUFFICIENT',
                },
                message: {
                  type: 'string',
                  example: '필요한 권한: {requiredRole}, 현재 권한: {userRole}',
                },
              },
            },
          },
        },
        AuthSessionExpiredError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'SESSION_EXPIRED',
                },
                message: {
                  type: 'string',
                  example: '세션이 만료되었습니다.',
                },
              },
            },
          },
        },
        AuthAccountLockedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ACCOUNT_LOCKED',
                },
                message: {
                  type: 'string',
                  example: '계정이 잠겨있습니다.',
                },
              },
            },
          },
        },
        AuthTooManyLoginAttemptsError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'TOO_MANY_LOGIN_ATTEMPTS',
                },
                message: {
                  type: 'string',
                  example:
                    '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
                },
              },
            },
          },
        },
        AuthValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'AUTH_VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: '인증 데이터 검증 오류: {message}',
                },
              },
            },
          },
        },
        AuthPasswordResetTokenExpiredError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'PASSWORD_RESET_TOKEN_EXPIRED',
                },
                message: {
                  type: 'string',
                  example: '비밀번호 재설정 토큰이 만료되었습니다.',
                },
              },
            },
          },
        },
        AuthEmailVerificationTokenExpiredError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
                },
                message: {
                  type: 'string',
                  example: '이메일 인증 토큰이 만료되었습니다.',
                },
              },
            },
          },
        },
        AuthLoginFailedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'LOGIN_FAILED',
                },
                message: {
                  type: 'string',
                  example: '로그인에 실패했습니다.',
                },
              },
            },
          },
        },
        AuthLogoutFailedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'LOGOUT_FAILED',
                },
                message: {
                  type: 'string',
                  example: '로그아웃에 실패했습니다.',
                },
              },
            },
          },
        },
        AuthRegistrationFailedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'REGISTRATION_FAILED',
                },
                message: {
                  type: 'string',
                  example: '회원가입에 실패했습니다.',
                },
              },
            },
          },
        },
        AuthPasswordChangeFailedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'PASSWORD_CHANGE_FAILED',
                },
                message: {
                  type: 'string',
                  example: '비밀번호 변경에 실패했습니다.',
                },
              },
            },
          },
        },
        AuthTokenRefreshFailedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'TOKEN_REFRESH_FAILED',
                },
                message: {
                  type: 'string',
                  example: '토큰 갱신에 실패했습니다.',
                },
              },
            },
          },
        },
        AuthInvalidRequestError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'INVALID_REQUEST',
                },
                message: {
                  type: 'string',
                  example: '잘못된 요청입니다.',
                },
              },
            },
          },
        },
        AuthSocialLoginFailedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'SOCIAL_LOGIN_FAILED',
                },
                message: {
                  type: 'string',
                  example: '{provider} 로그인: 소셜 로그인에 실패했습니다.',
                },
              },
            },
          },
        },
        AuthSocialProviderNotSupportedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'SOCIAL_PROVIDER_NOT_SUPPORTED',
                },
                message: {
                  type: 'string',
                  example: '지원하지 않는 소셜 로그인 제공자입니다: {provider}',
                },
              },
            },
          },
        },
        AuthSocialAccountNotLinkedError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'SOCIAL_ACCOUNT_NOT_LINKED',
                },
                message: {
                  type: 'string',
                  example: '{provider} 계정이 연결되지 않았습니다.',
                },
              },
            },
          },
        },
        AuthEmailNotProvidedBySocialError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'EMAIL_NOT_PROVIDED_BY_SOCIAL',
                },
                message: {
                  type: 'string',
                  example: '{provider}에서 이메일 정보를 제공하지 않았습니다.',
                },
              },
            },
          },
        },
        TermError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  enum: [
                    'TERM_NOT_FOUND',
                    'TERM_CREATION_FAILED',
                    'TERM_UPDATE_FAILED',
                  ],
                  example: 'TERM_NOT_FOUND',
                },
                message: {
                  type: 'string',
                  example: '약관을 찾을 수 없습니다.',
                },
              },
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
  apis: apiPaths, // 환경에 따라 다른 경로 사용
};

export const specs = swaggerJsdoc(options);

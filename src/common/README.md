# 에러 핸들러 및 응답 핸들러 가이드

## 개요

이 프로젝트는 DDD(Domain-Driven Design) 구조에 맞춰 도메인별로 에러와 성공 응답을 체계적으로 관리하는 시스템을 제공합니다.

## 구조

```
src/
├── common/
│   ├── exception/                    # 에러와 성공 응답 관리
│   │   ├── BaseError.ts             # 기본 에러 클래스
│   │   ├── ErrorHandler.ts          # 전역 에러 핸들러
│   │   ├── index.ts                 # 모든 export
│   │   ├── user/
│   │   │   ├── UserError.ts         # 사용자 도메인 에러
│   │   │   └── UserSuccess.ts       # 사용자 도메인 성공 응답
│   │   ├── class/
│   │   │   ├── ClassError.ts        # 클래스 도메인 에러
│   │   │   └── ClassSuccess.ts      # 클래스 도메인 성공 응답
│   │   ├── enrollment/
│   │   │   ├── EnrollmentError.ts   # 신청 도메인 에러
│   │   │   └── EnrollmentSuccess.ts # 신청 도메인 성공 응답
│   │   └── auth/
│   │       ├── AuthError.ts         # 인증 도메인 에러
│   │       └── AuthSuccess.ts       # 인증 도메인 성공 응답
│   └── README.md                    # 사용법 가이드
├── domains/                         # 도메인별 폴더 (현재 비어있음)
│   ├── user/
│   ├── class/
│   ├── enrollment/
│   ├── auth/
│   └── token/
└── examples/
    └── error-handler-usage.ts       # 사용 예시
```

## 사용법

### 1. 에러 처리

#### 기본 에러 클래스 사용
```typescript
import { ValidationError, NotFoundError, ConflictError } from '../common/errors';

// 검증 에러
throw new ValidationError('이메일 형식이 올바르지 않습니다.');

// 리소스 없음 에러
throw new NotFoundError('사용자를 찾을 수 없습니다.');

// 충돌 에러
throw new ConflictError('이미 존재하는 리소스입니다.');
```

#### 도메인별 에러 사용
```typescript
import { UserNotFoundError, UserAlreadyExistsError } from '../common/errors';
import { ClassNotFoundError, ClassCapacityExceededError } from '../common/errors';

// 사용자 도메인 에러
throw new UserNotFoundError('user-123');
throw new UserAlreadyExistsError('test@example.com');

// 클래스 도메인 에러
throw new ClassNotFoundError('class-456');
throw new ClassCapacityExceededError(30);
```

### 2. 성공 응답 처리

#### 기본 응답 핸들러 사용
```typescript
import { ResponseHandler } from '../common/response';

// 기본 성공 응답
ResponseHandler.success(res, data, '요청이 성공했습니다.');

// 생성 응답 (201)
ResponseHandler.created(res, newResource, '리소스가 생성되었습니다.');

// 내용 없음 응답 (204)
ResponseHandler.noContent(res);
```

#### 도메인별 성공 메시지 사용
```typescript
import { UserSuccessMessage, UserResponseMessages } from '../common/errors';
import { ClassSuccessMessage, ClassResponseMessages } from '../common/errors';

// 미리 정의된 메시지 사용
ResponseHandler.success(res, user, UserSuccessMessage.PROFILE_GET_SUCCESS);

// 동적 메시지 생성
const message = UserResponseMessages.getSignupSuccess('user-123');
ResponseHandler.created(res, newUser, message);
```

### 3. 비동기 에러 처리

#### ErrorHandler.asyncHandler 사용
```typescript
import { ErrorHandler, UserNotFoundError } from '../common/errors';

export const getUser = ErrorHandler.asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    
    const user = await findUserById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    
    ResponseHandler.success(res, user, UserSuccessMessage.PROFILE_GET_SUCCESS);
  }
);
```

## 도메인별 에러 및 응답

### User 도메인
- **에러**: `UserNotFoundError`, `UserAlreadyExistsError`, `UserValidationError` 등
- **성공**: 회원가입, 로그인, 프로필 업데이트 등 관련 메시지

### Class 도메인
- **에러**: `ClassNotFoundError`, `ClassCapacityExceededError`, `ClassPermissionError` 등
- **성공**: 클래스 생성, 수정, 조회 등 관련 메시지

### Enrollment 도메인
- **에러**: `EnrollmentNotFoundError`, `EnrollmentDuplicateError`, `EnrollmentCapacityExceededError` 등
- **성공**: 신청, 취소, 상태 변경 등 관련 메시지

### Auth 도메인
- **에러**: `AuthenticationError`, `InvalidCredentialsError`, `TokenExpiredError` 등
- **성공**: 로그인, 토큰 갱신, 권한 부여 등 관련 메시지

## 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 에러 응답
```json
{
  "success": false,
  "message": "사용자를 찾을 수 없습니다.",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users/123",
  "method": "GET"
}
```

## 설정

### 메인 애플리케이션에서 에러 핸들러 등록
```typescript
import { ErrorHandler } from './common/errors/ErrorHandler';

// 404 에러 핸들러
app.use(ErrorHandler.notFound);

// 전역 에러 핸들러 (반드시 마지막에 위치)
app.use(ErrorHandler.handle);
```

이 구조를 통해 도메인별로 체계적인 에러 처리와 응답 관리를 할 수 있습니다. 
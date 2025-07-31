# MClass Server

TypeScript와 Express를 사용한 Node.js 서버 프로젝트입니다.

## 설치

```bash
npm install
```

## 개발 모드 실행

```bash
npm run dev
```

이 명령어는 nodemon을 사용하여 TypeScript 파일 변경 시 자동으로 서버를 재시작합니다.

## 프로덕션 빌드

```bash
npm run build
```

TypeScript 파일을 JavaScript로 컴파일합니다.

## 프로덕션 실행

```bash
npm start
```

컴파일된 JavaScript 파일을 실행합니다.

## 프로젝트 구조

```
mclass_server/
├── src/           # TypeScript 소스 코드
├── dist/          # 컴파일된 JavaScript 파일 (자동 생성)
├── package.json   # 프로젝트 설정
├── tsconfig.json  # TypeScript 설정
└── nodemon.json   # nodemon 설정
```

## 주요 스크립트

- `npm run dev`: 개발 모드 실행 (자동 재시작)
- `npm run build`: TypeScript 컴파일
- `npm start`: 프로덕션 실행
- `npm test`: 테스트 실행 
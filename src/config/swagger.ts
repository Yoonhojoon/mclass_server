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
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '사용자 ID',
            },
            name: {
              type: 'string',
              description: '사용자 이름',
            },
            email: {
              type: 'string',
              description: '사용자 이메일',
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
  },
  apis: ['./src/routes/*.ts', './src/index.ts'], // API 라우트 파일들
};

export const specs = swaggerJsdoc(options);

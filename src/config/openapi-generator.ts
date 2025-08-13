import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry, openApiConfig } from './swagger-zod.js';

// 모든 OpenAPI 스키마를 로드
import '../schemas/openapi.index.js';

// OpenAPI 문서 생성
export const generateOpenApiDocument = (): any => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    ...openApiConfig,
  });

  // 보안 스키마가 제대로 포함되었는지 확인하고 추가
  if (!document.components) {
    document.components = {};
  }

  if (!document.components.securitySchemes) {
    document.components.securitySchemes = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT 토큰을 입력하세요. 예: Bearer <token>',
      },
    };
  }

  // 전역 보안 설정 추가
  if (!document.security) {
    document.security = [
      {
        bearerAuth: [],
      },
    ];
  }

  return document;
};

// OpenAPI JSON 문서 생성
export const generateOpenApiJson = (): any => {
  return generateOpenApiDocument();
};

// OpenAPI YAML 문서 생성 (필요시)
export const generateOpenApiYaml = (): any => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    ...openApiConfig,
  });
};

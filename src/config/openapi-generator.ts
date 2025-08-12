import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry, openApiConfig } from './swagger-zod.js';

// 모든 OpenAPI 스키마를 로드
import '../schemas/openapi.index.js';

// OpenAPI 문서 생성
export const generateOpenApiDocument = (): any => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    ...openApiConfig,
  });
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

import { generateOpenApiJson } from '../dist/config/openapi-generator.js';
import fs from 'fs';
import path from 'path';

console.log('🚀 OpenAPI 자동 생성 테스트 시작...');

try {
  // OpenAPI 문서 생성
  const openApiDoc = generateOpenApiJson();
  
  // JSON 파일로 저장
  const outputPath = path.join(process.cwd(), 'openapi-generated.json');
  fs.writeFileSync(outputPath, JSON.stringify(openApiDoc, null, 2));
  
  console.log('✅ OpenAPI 문서 생성 성공!');
  console.log(`📄 생성된 파일: ${outputPath}`);
  console.log(`📊 API 엔드포인트 수: ${Object.keys(openApiDoc.paths || {}).length}`);
  console.log(`🔧 스키마 수: ${Object.keys(openApiDoc.components?.schemas || {}).length}`);
  
  // 주요 정보 출력
  console.log('\n📋 생성된 API 정보:');
  console.log(`- 제목: ${openApiDoc.info?.title}`);
  console.log(`- 버전: ${openApiDoc.info?.version}`);
  console.log(`- 설명: ${openApiDoc.info?.description}`);
  
  if (openApiDoc.paths) {
    console.log('\n🔗 등록된 엔드포인트:');
    Object.keys(openApiDoc.paths).forEach(path => {
      const methods = Object.keys(openApiDoc.paths[path]);
      console.log(`  ${methods.join(', ').toUpperCase()} ${path}`);
    });
  }
  
  if (openApiDoc.components?.schemas) {
    console.log('\n🔧 등록된 스키마:');
    Object.keys(openApiDoc.components.schemas).forEach(schema => {
      console.log(`  - ${schema}`);
    });
  }
  
} catch (error) {
  console.error('❌ OpenAPI 문서 생성 실패:', error);
  console.error('스택 트레이스:', error.stack);
  process.exit(1);
}

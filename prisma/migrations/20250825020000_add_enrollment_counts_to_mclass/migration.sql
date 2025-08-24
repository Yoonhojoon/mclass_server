-- MClass 테이블에 인원 수 필드 추가
ALTER TABLE "mclasses" ADD COLUMN "approved_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mclasses" ADD COLUMN "waitlisted_count" INTEGER NOT NULL DEFAULT 0;

-- 기존 데이터에 대해 실제 인원 수로 업데이트
UPDATE "mclasses" 
SET 
  "approved_count" = (
    SELECT COUNT(*) 
    FROM "enrollments" 
    WHERE "enrollments"."mclass_id" = "mclasses"."id" 
    AND "enrollments"."status" = 'APPROVED'
  ),
  "waitlisted_count" = (
    SELECT COUNT(*) 
    FROM "enrollments" 
    WHERE "enrollments"."mclass_id" = "mclasses"."id" 
    AND "enrollments"."status" = 'WAITLISTED'
  );

-- 인덱스 추가 (성능 최적화)
CREATE INDEX "mclasses_approved_count_idx" ON "mclasses"("approved_count");
CREATE INDEX "mclasses_waitlisted_count_idx" ON "mclasses"("waitlisted_count");

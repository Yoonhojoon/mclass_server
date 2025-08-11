/*
  Warnings:

  - Made the column `recruitEndAt` on table `mclasses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recruitStartAt` on table `mclasses` required. This step will fail if there are existing NULL values in that column.

*/

-- 기존 NULL 값들을 기본값으로 설정
-- recruitStartAt이 NULL인 경우 startAt 7일 전으로 설정
UPDATE "public"."mclasses" 
SET "recruitStartAt" = "startAt" - INTERVAL '7 days'
WHERE "recruitStartAt" IS NULL;

-- recruitEndAt이 NULL인 경우 startAt 1일 전으로 설정
UPDATE "public"."mclasses" 
SET "recruitEndAt" = "startAt" - INTERVAL '1 day'
WHERE "recruitEndAt" IS NULL;

-- AlterTable
ALTER TABLE "public"."mclasses" ALTER COLUMN "recruitEndAt" SET NOT NULL,
ALTER COLUMN "recruitStartAt" SET NOT NULL;

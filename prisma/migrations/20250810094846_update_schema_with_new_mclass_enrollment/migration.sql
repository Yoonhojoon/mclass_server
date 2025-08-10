/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentId]` on the table `enrollment_forms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `enrollmentId` to the `enrollment_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `enrollment_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `mclasses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SelectionType" AS ENUM ('FIRST_COME', 'REVIEW');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('PUBLIC', 'UNLISTED');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('APPLIED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "public"."enrollment_forms" DROP CONSTRAINT "enrollment_forms_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_mclassId_fkey";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."mclasses" ADD COLUMN     "allowWaitlist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fee" INTEGER,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "recruitEndAt" TIMESTAMP(3),
ADD COLUMN     "recruitStartAt" TIMESTAMP(3),
ADD COLUMN     "selectionType" "public"."SelectionType" NOT NULL DEFAULT 'FIRST_COME',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "visibility" "public"."Visibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "waitlistCapacity" INTEGER,
ALTER COLUMN "capacity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."enrollments" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'APPLIED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."enrollment_forms" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "enrollmentId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 기존 데이터에 대한 기본값 설정
-- users 테이블의 updatedAt 필드에 기본값 설정
UPDATE "public"."users" SET "updatedAt" = "createdAt" WHERE "updatedAt" = CURRENT_TIMESTAMP;

-- mclasses 테이블의 updatedAt 필드에 기본값 설정
UPDATE "public"."mclasses" SET "updatedAt" = "createdAt" WHERE "updatedAt" = CURRENT_TIMESTAMP;

-- enrollments 테이블의 updatedAt 필드에 기본값 설정
UPDATE "public"."enrollments" SET "updatedAt" = "appliedAt" WHERE "updatedAt" = CURRENT_TIMESTAMP;

-- enrollment_forms 테이블의 enrollmentId 필드 설정 (기존 id 값을 사용)
UPDATE "public"."enrollment_forms" SET "enrollmentId" = "id" WHERE "enrollmentId" = '';

-- enrollment_forms 테이블의 updatedAt 필드에 기본값 설정
UPDATE "public"."enrollment_forms" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" = CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_forms_enrollmentId_key" ON "public"."enrollment_forms"("enrollmentId");

-- CreateIndex
CREATE INDEX "enrollments_mclassId_status_idx" ON "public"."enrollments"("mclassId", "status");

-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "public"."enrollments"("userId");

-- CreateIndex
CREATE INDEX "mclasses_visibility_recruitStartAt_recruitEndAt_idx" ON "public"."mclasses"("visibility", "recruitStartAt", "recruitEndAt");

-- CreateIndex
CREATE INDEX "mclasses_startAt_idx" ON "public"."mclasses"("startAt");

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_mclassId_fkey" FOREIGN KEY ("mclassId") REFERENCES "public"."mclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollment_forms" ADD CONSTRAINT "enrollment_forms_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

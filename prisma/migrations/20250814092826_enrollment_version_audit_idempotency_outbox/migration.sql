/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ReasonType" AS ENUM ('REJECT', 'CANCEL');

-- CreateEnum
CREATE TYPE "public"."EmailType" AS ENUM ('ENROLLMENT_APPLIED', 'ENROLLMENT_APPROVED', 'ENROLLMENT_REJECTED', 'ENROLLMENT_WAITLISTED', 'ENROLLMENT_CANCELED', 'WAITLIST_PROMOTED');

-- AlterTable
ALTER TABLE "public"."enrollments" ADD COLUMN     "decidedByAdminId" TEXT,
ADD COLUMN     "formSnapshot" JSONB,
ADD COLUMN     "formVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "reasonType" "public"."ReasonType",
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."email_outbox" (
    "id" TEXT NOT NULL,
    "type" "public"."EmailType" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "payload" JSONB NOT NULL,
    "template" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextTryAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_outbox_type_processedAt_idx" ON "public"."email_outbox"("type", "processedAt");

-- CreateIndex
CREATE INDEX "email_outbox_nextTryAt_attempts_idx" ON "public"."email_outbox"("nextTryAt", "attempts");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_idempotencyKey_key" ON "public"."enrollments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "enrollments_mclassId_status_appliedAt_idx" ON "public"."enrollments"("mclassId", "status", "appliedAt");

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_decidedByAdminId_fkey" FOREIGN KEY ("decidedByAdminId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

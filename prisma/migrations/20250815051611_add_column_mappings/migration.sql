/*
  Warnings:

  - You are about to drop the column `createdAt` on the `email_outbox` table. All the data in the column will be lost.
  - You are about to drop the column `nextTryAt` on the `email_outbox` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `email_outbox` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `email_outbox` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `mclassId` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `appliedAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `canceledAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `decidedAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `decidedByAdminId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentFormId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `formSnapshot` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `formVersion` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `idempotencyKey` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `mclassId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `reasonType` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `allowWaitlist` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `endAt` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `isOnline` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `recruitEndAt` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `recruitStartAt` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `selectionType` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `waitlistCapacity` on the `mclasses` table. All the data in the column will be lost.
  - You are about to drop the column `agreedAt` on the `user_term_agreements` table. All the data in the column will be lost.
  - You are about to drop the column `termId` on the `user_term_agreements` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_term_agreements` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isSignUpCompleted` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `socialId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mclass_id]` on the table `enrollment_forms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,mclass_id]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,term_id]` on the table `user_term_agreements` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider,social_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `email_outbox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mclass_id` to the `enrollment_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `enrollment_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enrollment_form_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mclass_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `mclasses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_at` to the `mclasses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recruit_end_at` to the `mclasses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recruit_start_at` to the `mclasses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_at` to the `mclasses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `mclasses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term_id` to the `user_term_agreements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_term_agreements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."enrollment_forms" DROP CONSTRAINT "enrollment_forms_mclassId_fkey";

-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_decidedByAdminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_enrollmentFormId_fkey";

-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_mclassId_fkey";

-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."mclasses" DROP CONSTRAINT "mclasses_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_term_agreements" DROP CONSTRAINT "user_term_agreements_termId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_term_agreements" DROP CONSTRAINT "user_term_agreements_userId_fkey";

-- DropIndex
DROP INDEX "public"."email_outbox_nextTryAt_attempts_idx";

-- DropIndex
DROP INDEX "public"."email_outbox_type_processedAt_idx";

-- DropIndex
DROP INDEX "public"."enrollment_forms_mclassId_key";

-- DropIndex
DROP INDEX "public"."enrollments_idempotencyKey_key";

-- DropIndex
DROP INDEX "public"."enrollments_mclassId_status_appliedAt_idx";

-- DropIndex
DROP INDEX "public"."enrollments_mclassId_status_idx";

-- DropIndex
DROP INDEX "public"."enrollments_userId_idx";

-- DropIndex
DROP INDEX "public"."enrollments_userId_mclassId_key";

-- DropIndex
DROP INDEX "public"."mclasses_startAt_idx";

-- DropIndex
DROP INDEX "public"."mclasses_visibility_recruitStartAt_recruitEndAt_idx";

-- DropIndex
DROP INDEX "public"."user_term_agreements_userId_termId_key";

-- DropIndex
DROP INDEX "public"."users_provider_socialId_key";

-- AlterTable
ALTER TABLE "public"."email_outbox" DROP COLUMN "createdAt",
DROP COLUMN "nextTryAt",
DROP COLUMN "processedAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "next_try_at" TIMESTAMP(3),
ADD COLUMN     "processed_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."enrollment_forms" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "mclassId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mclass_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."enrollments" DROP COLUMN "appliedAt",
DROP COLUMN "canceledAt",
DROP COLUMN "createdAt",
DROP COLUMN "decidedAt",
DROP COLUMN "decidedByAdminId",
DROP COLUMN "enrollmentFormId",
DROP COLUMN "formSnapshot",
DROP COLUMN "formVersion",
DROP COLUMN "idempotencyKey",
DROP COLUMN "mclassId",
DROP COLUMN "reasonType",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "decided_at" TIMESTAMP(3),
ADD COLUMN     "decided_by_admin_id" TEXT,
ADD COLUMN     "enrollment_form_id" TEXT NOT NULL,
ADD COLUMN     "form_snapshot" JSONB,
ADD COLUMN     "form_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "mclass_id" TEXT NOT NULL,
ADD COLUMN     "reason_type" "public"."ReasonType",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."mclasses" DROP COLUMN "allowWaitlist",
DROP COLUMN "createdAt",
DROP COLUMN "createdBy",
DROP COLUMN "endAt",
DROP COLUMN "isOnline",
DROP COLUMN "recruitEndAt",
DROP COLUMN "recruitStartAt",
DROP COLUMN "selectionType",
DROP COLUMN "startAt",
DROP COLUMN "updatedAt",
DROP COLUMN "waitlistCapacity",
ADD COLUMN     "allow_waitlist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "end_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "recruit_end_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "recruit_start_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "selection_type" "public"."SelectionType" NOT NULL DEFAULT 'FIRST_COME',
ADD COLUMN     "start_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "waitlist_capacity" INTEGER;

-- AlterTable
ALTER TABLE "public"."user_term_agreements" DROP COLUMN "agreedAt",
DROP COLUMN "termId",
DROP COLUMN "userId",
ADD COLUMN     "agreed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "term_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "createdAt",
DROP COLUMN "isAdmin",
DROP COLUMN "isSignUpCompleted",
DROP COLUMN "socialId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_sign_up_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "social_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "email_outbox_type_processed_at_idx" ON "public"."email_outbox"("type", "processed_at");

-- CreateIndex
CREATE INDEX "email_outbox_next_try_at_attempts_idx" ON "public"."email_outbox"("next_try_at", "attempts");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_forms_mclass_id_key" ON "public"."enrollment_forms"("mclass_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_idempotency_key_key" ON "public"."enrollments"("idempotency_key");

-- CreateIndex
CREATE INDEX "enrollments_mclass_id_status_idx" ON "public"."enrollments"("mclass_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_user_id_idx" ON "public"."enrollments"("user_id");

-- CreateIndex
CREATE INDEX "enrollments_mclass_id_status_applied_at_idx" ON "public"."enrollments"("mclass_id", "status", "applied_at");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_mclass_id_key" ON "public"."enrollments"("user_id", "mclass_id");

-- CreateIndex
CREATE INDEX "mclasses_visibility_recruit_start_at_recruit_end_at_idx" ON "public"."mclasses"("visibility", "recruit_start_at", "recruit_end_at");

-- CreateIndex
CREATE INDEX "mclasses_start_at_idx" ON "public"."mclasses"("start_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_term_agreements_user_id_term_id_key" ON "public"."user_term_agreements"("user_id", "term_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_social_id_key" ON "public"."users"("provider", "social_id");

-- AddForeignKey
ALTER TABLE "public"."mclasses" ADD CONSTRAINT "mclasses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_term_agreements" ADD CONSTRAINT "user_term_agreements_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_term_agreements" ADD CONSTRAINT "user_term_agreements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_enrollment_form_id_fkey" FOREIGN KEY ("enrollment_form_id") REFERENCES "public"."enrollment_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_mclass_id_fkey" FOREIGN KEY ("mclass_id") REFERENCES "public"."mclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_decided_by_admin_id_fkey" FOREIGN KEY ("decided_by_admin_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollment_forms" ADD CONSTRAINT "enrollment_forms_mclass_id_fkey" FOREIGN KEY ("mclass_id") REFERENCES "public"."mclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

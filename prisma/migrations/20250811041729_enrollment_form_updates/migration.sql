/*
  Warnings:

  - You are about to drop the column `address` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `agreeTerms` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `availableTime` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentId` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `introduce` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `isStudent` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `major` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `schoolName` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `supportReason` on the `enrollment_forms` table. All the data in the column will be lost.
  - You are about to drop the column `wantedActivity` on the `enrollment_forms` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mclassId]` on the table `enrollment_forms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mclassId` to the `enrollment_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questions` to the `enrollment_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `enrollment_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `answers` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enrollmentFormId` to the `enrollments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."enrollment_forms" DROP CONSTRAINT "enrollment_forms_enrollmentId_fkey";

-- DropIndex
DROP INDEX "public"."enrollment_forms_enrollmentId_key";

-- AlterTable
ALTER TABLE "public"."enrollment_forms" DROP COLUMN "address",
DROP COLUMN "agreeTerms",
DROP COLUMN "availableTime",
DROP COLUMN "birthDate",
DROP COLUMN "enrollmentId",
DROP COLUMN "experience",
DROP COLUMN "gender",
DROP COLUMN "introduce",
DROP COLUMN "isStudent",
DROP COLUMN "major",
DROP COLUMN "phone",
DROP COLUMN "schoolName",
DROP COLUMN "supportReason",
DROP COLUMN "wantedActivity",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mclassId" TEXT NOT NULL,
ADD COLUMN     "questions" JSONB NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."enrollments" ADD COLUMN     "answers" JSONB NOT NULL,
ADD COLUMN     "enrollmentFormId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_forms_mclassId_key" ON "public"."enrollment_forms"("mclassId");

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_enrollmentFormId_fkey" FOREIGN KEY ("enrollmentFormId") REFERENCES "public"."enrollment_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollment_forms" ADD CONSTRAINT "enrollment_forms_mclassId_fkey" FOREIGN KEY ("mclassId") REFERENCES "public"."mclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

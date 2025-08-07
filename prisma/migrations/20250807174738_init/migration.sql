-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."Provider" AS ENUM ('LOCAL', 'KAKAO', 'GOOGLE', 'NAVER');

-- CreateEnum
CREATE TYPE "public"."TermType" AS ENUM ('SERVICE', 'PRIVACY', 'ENROLLMENT');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('M', 'F');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "provider" "public"."Provider" NOT NULL DEFAULT 'LOCAL',
    "socialId" TEXT,
    "isSignUpCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mclasses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mclasses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."terms" (
    "id" TEXT NOT NULL,
    "type" "public"."TermType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_term_agreements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_term_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mclassId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enrollment_forms" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "public"."Gender",
    "isStudent" BOOLEAN NOT NULL DEFAULT false,
    "schoolName" TEXT,
    "major" TEXT,
    "address" TEXT,
    "availableTime" TEXT[],
    "supportReason" TEXT,
    "wantedActivity" TEXT,
    "experience" TEXT,
    "introduce" TEXT,
    "agreeTerms" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "enrollment_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_socialId_key" ON "public"."users"("provider", "socialId");

-- CreateIndex
CREATE UNIQUE INDEX "user_term_agreements_userId_termId_key" ON "public"."user_term_agreements"("userId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_mclassId_key" ON "public"."enrollments"("userId", "mclassId");

-- AddForeignKey
ALTER TABLE "public"."mclasses" ADD CONSTRAINT "mclasses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_term_agreements" ADD CONSTRAINT "user_term_agreements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_term_agreements" ADD CONSTRAINT "user_term_agreements_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_mclassId_fkey" FOREIGN KEY ("mclassId") REFERENCES "public"."mclasses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollment_forms" ADD CONSTRAINT "enrollment_forms_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

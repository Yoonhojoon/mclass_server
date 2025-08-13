/*
  Warnings:

  - Made the column `recruitEndAt` on table `mclasses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recruitStartAt` on table `mclasses` required. This step will fail if there are existing NULL values in that column.

*/

-- 데이터 검증: NULL 값 및 잘못된 날짜 순서 확인 (테이블이 존재할 때만)
DO $$
DECLARE
    invalid_count INTEGER;
    table_exists BOOLEAN;
BEGIN
    -- 테이블 존재 여부 확인
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mclasses'
    ) INTO table_exists;
    
    -- 테이블이 존재할 때만 검증 실행
    IF table_exists THEN
        -- NULL 값이나 잘못된 날짜 순서를 가진 레코드 수 확인
        SELECT COUNT(*) INTO invalid_count
        FROM "public"."mclasses"
        WHERE "recruitStartAt" IS NULL 
           OR "recruitEndAt" IS NULL 
           OR "recruitStartAt" >= "recruitEndAt" 
           OR "recruitEndAt" > "startAt";
        
        -- 잘못된 데이터가 있으면 예외 발생
        IF invalid_count > 0 THEN
            RAISE EXCEPTION 'Found % rows with invalid recruit dates. Please fix data before migration.', invalid_count;
        END IF;
    END IF;
END $$;

-- 기존 NULL 값들을 기본값으로 설정 (테이블이 존재할 때만)
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- 테이블 존재 여부 확인
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mclasses'
    ) INTO table_exists;
    
    -- 테이블이 존재할 때만 UPDATE 실행
    IF table_exists THEN
        -- recruitStartAt이 NULL인 경우 startAt 7일 전으로 설정
        UPDATE "public"."mclasses" 
        SET "recruitStartAt" = "startAt" - INTERVAL '7 days'
        WHERE "recruitStartAt" IS NULL;

        -- recruitEndAt이 NULL인 경우 startAt 1일 전으로 설정
        UPDATE "public"."mclasses" 
        SET "recruitEndAt" = "startAt" - INTERVAL '1 day'
        WHERE "recruitEndAt" IS NULL;
    END IF;
END $$;

-- AlterTable (테이블이 존재할 때만)
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- 테이블 존재 여부 확인
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mclasses'
    ) INTO table_exists;
    
    -- 테이블이 존재할 때만 ALTER TABLE 실행
    IF table_exists THEN
        ALTER TABLE "public"."mclasses" ALTER COLUMN "recruitEndAt" SET NOT NULL;
        ALTER TABLE "public"."mclasses" ALTER COLUMN "recruitStartAt" SET NOT NULL;
        
        -- DB 레벨 CHECK 제약 조건 추가
        -- recruitStartAt < recruitEndAt AND recruitEndAt <= startAt
        ALTER TABLE "public"."mclasses" 
        ADD CONSTRAINT "chk_recruit_dates" 
        CHECK ("recruitStartAt" < "recruitEndAt" AND "recruitEndAt" <= "startAt");
    END IF;
END $$;

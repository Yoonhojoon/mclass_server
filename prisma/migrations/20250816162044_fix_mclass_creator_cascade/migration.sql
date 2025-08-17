-- DropForeignKey
ALTER TABLE "public"."mclasses" DROP CONSTRAINT "mclasses_created_by_fkey";

-- AlterTable
ALTER TABLE "public"."mclasses" ALTER COLUMN "created_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."mclasses" ADD CONSTRAINT "mclasses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

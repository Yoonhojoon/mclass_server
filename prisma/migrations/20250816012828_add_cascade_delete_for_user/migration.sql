-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."mclasses" DROP CONSTRAINT "mclasses_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_term_agreements" DROP CONSTRAINT "user_term_agreements_user_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."mclasses" ADD CONSTRAINT "mclasses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_term_agreements" ADD CONSTRAINT "user_term_agreements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

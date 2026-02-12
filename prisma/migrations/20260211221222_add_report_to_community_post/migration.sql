-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "community_post_id" UUID;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_community_post_id_fkey" FOREIGN KEY ("community_post_id") REFERENCES "community_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

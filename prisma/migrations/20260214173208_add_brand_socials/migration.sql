-- AlterTable
ALTER TABLE "users" ADD COLUMN     "brand_facebook" TEXT,
ADD COLUMN     "brand_linkedin" TEXT,
ADD COLUMN     "brand_tiktok" TEXT,
ADD COLUMN     "brand_twitter" TEXT;

-- CreateIndex
CREATE INDEX "community_posts_status_idx" ON "community_posts"("status");

-- CreateIndex
CREATE INDEX "disputes_status_created_at_idx" ON "disputes"("status", "created_at");

-- CreateIndex
CREATE INDEX "listings_is_distress_sale_idx" ON "listings"("is_distress_sale");

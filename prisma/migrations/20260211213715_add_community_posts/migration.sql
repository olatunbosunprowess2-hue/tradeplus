/*
  Warnings:

  - A unique constraint covering the columns `[user_id,listing_id]` on the table `recently_viewed` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "barter_offers" ADD COLUMN     "downpayment_confirmed_at" TIMESTAMPTZ,
ADD COLUMN     "downpayment_paid_at" TIMESTAMPTZ,
ADD COLUMN     "downpayment_status" TEXT NOT NULL DEFAULT 'none';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "downpayment_cents" BIGINT,
ADD COLUMN     "downpayment_currency" CHAR(3),
ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_provider" TEXT,
ADD COLUMN     "boost_notification_count_24h" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "boost_notification_reset_at" TIMESTAMPTZ,
ADD COLUMN     "brand_application_note" TEXT,
ADD COLUMN     "brand_instagram" TEXT,
ADD COLUMN     "brand_name" TEXT,
ADD COLUMN     "brand_phone_number" TEXT,
ADD COLUMN     "brand_physical_address" TEXT,
ADD COLUMN     "brand_proof_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "brand_rejection_reason" TEXT,
ADD COLUMN     "brand_verification_status" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "brand_verified_at" TIMESTAMPTZ,
ADD COLUMN     "brand_website" TEXT,
ADD COLUMN     "brand_whatsapp" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "last_boost_notification_at" TIMESTAMPTZ,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "waitlist" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'brand_feature',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_offers" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "offerer_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_created_at_idx" ON "waitlist"("created_at");

-- CreateIndex
CREATE INDEX "community_posts_author_id_idx" ON "community_posts"("author_id");

-- CreateIndex
CREATE INDEX "community_posts_status_created_at_idx" ON "community_posts"("status", "created_at");

-- CreateIndex
CREATE INDEX "community_posts_created_at_idx" ON "community_posts"("created_at");

-- CreateIndex
CREATE INDEX "post_comments_post_id_created_at_idx" ON "post_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "post_offers_post_id_idx" ON "post_offers"("post_id");

-- CreateIndex
CREATE INDEX "post_offers_offerer_id_idx" ON "post_offers"("offerer_id");

-- CreateIndex
CREATE INDEX "cart_items_listing_id_idx" ON "cart_items"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "recently_viewed_user_id_listing_id_key" ON "recently_viewed"("user_id", "listing_id");

-- CreateIndex
CREATE INDEX "user_profiles_region_id_idx" ON "user_profiles"("region_id");

-- CreateIndex
CREATE INDEX "users_boost_notification_count_24h_idx" ON "users"("boost_notification_count_24h");

-- CreateIndex
CREATE INDEX "users_brand_verification_status_idx" ON "users"("brand_verification_status");

-- CreateIndex
CREATE INDEX "wants_category_idx" ON "wants"("category");

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_offers" ADD CONSTRAINT "post_offers_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_offers" ADD CONSTRAINT "post_offers_offerer_id_fkey" FOREIGN KEY ("offerer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

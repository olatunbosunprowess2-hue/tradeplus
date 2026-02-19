-- AlterTable
ALTER TABLE "barter_offers" ADD COLUMN     "extension_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timer_expires_at" TIMESTAMPTZ,
ADD COLUMN     "timer_paused_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "country_id" INTEGER;

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "has_downpayment_override" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "override_type" TEXT,
ADD COLUMN     "override_value" BIGINT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "read_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "daily_offer_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daily_offer_reset_at" TIMESTAMPTZ,
ADD COLUMN     "daily_post_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daily_post_reset_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "brand_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "require_downpayment" BOOLEAN NOT NULL DEFAULT false,
    "downpayment_type" TEXT NOT NULL DEFAULT 'FIXED',
    "downpayment_value" BIGINT NOT NULL DEFAULT 0,
    "default_timer_duration" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_settings_user_id_key" ON "brand_settings"("user_id");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_signup_ip_address_idx" ON "users"("signup_ip_address");

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

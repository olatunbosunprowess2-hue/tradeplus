-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "is_cross_listed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "push_notification_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spotlight_expiry" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "chat_pass_expiry" TIMESTAMPTZ,
ADD COLUMN     "daily_chat_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daily_chat_reset_at" TIMESTAMPTZ,
ADD COLUMN     "spotlight_credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "paystack_sub_code" TEXT,
    "paystack_cust_code" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "listing_id" UUID,
    "paystack_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_expires_at_idx" ON "subscriptions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "purchases_user_id_idx" ON "purchases"("user_id");

-- CreateIndex
CREATE INDEX "purchases_paystack_ref_idx" ON "purchases"("paystack_ref");

-- CreateIndex
CREATE INDEX "purchases_status_idx" ON "purchases"("status");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

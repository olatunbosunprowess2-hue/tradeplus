-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "distress_expires_at" TIMESTAMPTZ,
ADD COLUMN     "distress_reason" TEXT,
ADD COLUMN     "is_distress_sale" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "item_price_cents" BIGINT NOT NULL,
    "protection_fee_cents" BIGINT NOT NULL,
    "commission_cents" BIGINT NOT NULL,
    "total_paid_cents" BIGINT NOT NULL,
    "seller_receives_cents" BIGINT NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmation_code" TEXT,
    "payment_provider" TEXT NOT NULL DEFAULT 'mock',
    "payment_reference" TEXT,
    "payment_url" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "released_at" TIMESTAMPTZ,
    "refunded_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_order_id_key" ON "escrow_transactions"("order_id");

-- CreateIndex
CREATE INDEX "escrow_transactions_status_idx" ON "escrow_transactions"("status");

-- CreateIndex
CREATE INDEX "escrow_transactions_expires_at_idx" ON "escrow_transactions"("expires_at");

-- CreateIndex
CREATE INDEX "escrow_transactions_payment_reference_idx" ON "escrow_transactions"("payment_reference");

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[supabase_user_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "barter_offers" ADD COLUMN     "dispute_status" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "listing_owner_confirmed_at" TIMESTAMPTZ,
ADD COLUMN     "offer_maker_confirmed_at" TIMESTAMPTZ,
ADD COLUMN     "receipt_available_at" TIMESTAMPTZ,
ADD COLUMN     "receipt_generated_at" TIMESTAMPTZ,
ADD COLUMN     "receipt_number" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "supabase_user_id" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_user_id_key" ON "users"("supabase_user_id");

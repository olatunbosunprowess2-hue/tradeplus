-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "response_tracked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seller_first_response_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "conversations_responded_within_24h" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_response_rate_update" TIMESTAMPTZ,
ADD COLUMN     "response_rate" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "total_conversations_received" INTEGER NOT NULL DEFAULT 0;

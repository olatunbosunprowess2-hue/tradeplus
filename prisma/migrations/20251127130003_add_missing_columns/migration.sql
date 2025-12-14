-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('PHYSICAL', 'SERVICE');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "type" "ListingType" NOT NULL DEFAULT 'PHYSICAL',
ALTER COLUMN "condition" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "evidence_images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "faceVerificationUrl" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "idDocumentBackUrl" TEXT,
ADD COLUMN     "idDocumentFrontUrl" TEXT,
ADD COLUMN     "idDocumentType" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "listings_deleted_at_idx" ON "listings"("deleted_at");

-- CreateIndex
CREATE INDEX "listings_category_id_status_idx" ON "listings"("category_id", "status");

-- CreateIndex
CREATE INDEX "listings_seller_id_status_idx" ON "listings"("seller_id", "status");

-- CreateIndex
CREATE INDEX "listings_price_cents_idx" ON "listings"("price_cents");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at");

-- CreateIndex
CREATE INDEX "listings_title_idx" ON "listings"("title");

-- CreateIndex
CREATE INDEX "orders_deleted_at_idx" ON "orders"("deleted_at");

-- CreateIndex
CREATE INDEX "orders_buyer_id_status_idx" ON "orders"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "orders_seller_id_status_idx" ON "orders"("seller_id", "status");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

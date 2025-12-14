-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "barter_preference_1" VARCHAR(100),
ADD COLUMN     "barter_preference_2" VARCHAR(100),
ADD COLUMN     "barter_preference_3" VARCHAR(100),
ADD COLUMN     "barter_preferences_only" BOOLEAN NOT NULL DEFAULT false;

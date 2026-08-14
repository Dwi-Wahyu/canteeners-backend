/*
  Warnings:

  - You are about to drop the `payment_proofs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FcmPlatform" AS ENUM ('WEB', 'ANDROID', 'IOS');

-- DropForeignKey
ALTER TABLE "payment_proofs" DROP CONSTRAINT "payment_proofs_order_id_fkey";

-- DropTable
DROP TABLE "payment_proofs";

-- DropEnum
DROP TYPE "PaymentProofStatus";

-- CreateTable
CREATE TABLE "user_fcm_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "FcmPlatform" NOT NULL,
    "browser" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_fcm_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_fcm_tokens_token_key" ON "user_fcm_tokens"("token");

-- CreateIndex
CREATE INDEX "user_fcm_tokens_user_id_idx" ON "user_fcm_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_fcm_tokens_platform_idx" ON "user_fcm_tokens"("platform");

-- AddForeignKey
ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "user_fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

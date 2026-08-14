-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('CUSTOMER_OWNER', 'CUSTOMER_COURIER', 'ADMIN_SUPPORT');

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT IF EXISTS "chats_customer_id_fkey";
ALTER TABLE "chats" DROP CONSTRAINT IF EXISTS "chats_owner_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "chats_customer_id_idx";
DROP INDEX IF EXISTS "chats_owner_id_idx";
DROP INDEX IF EXISTS "chats_customer_id_owner_id_key";

-- AlterTable
ALTER TABLE "chats" DROP COLUMN IF EXISTS "customer_id",
DROP COLUMN IF EXISTS "owner_id",
ADD COLUMN "participant_one_id" TEXT NOT NULL,
ADD COLUMN "participant_two_id" TEXT NOT NULL,
ADD COLUMN "type" "ChatType" NOT NULL DEFAULT 'CUSTOMER_OWNER',
ADD COLUMN "context_id" TEXT;

-- CreateIndex
CREATE INDEX "chats_participant_one_id_idx" ON "chats"("participant_one_id");
CREATE INDEX "chats_participant_two_id_idx" ON "chats"("participant_two_id");
CREATE UNIQUE INDEX "chats_participant_one_id_participant_two_id_type_context_id_key" ON "chats"("participant_one_id", "participant_two_id", "type", "context_id");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_participant_one_id_fkey" FOREIGN KEY ("participant_one_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chats" ADD CONSTRAINT "chats_participant_two_id_fkey" FOREIGN KEY ("participant_two_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

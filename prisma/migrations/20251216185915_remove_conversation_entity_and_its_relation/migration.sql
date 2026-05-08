/*
  Warnings:

  - You are about to drop the column `conversation_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `conversation_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_user_id_fkey";

-- DropForeignKey
ALTER TABLE "message_media" DROP CONSTRAINT "message_media_message_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_order_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_conversation_id_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "conversation_id";

-- DropTable
DROP TABLE "conversation_participants";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "message_media";

-- DropTable
DROP TABLE "messages";

-- DropEnum
DROP TYPE "MediaMimeType";

-- DropEnum
DROP TYPE "MessageType";

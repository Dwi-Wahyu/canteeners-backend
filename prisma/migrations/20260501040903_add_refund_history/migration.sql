-- CreateTable
CREATE TABLE "refund_histories" (
    "id" TEXT NOT NULL,
    "refund_id" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refund_histories_refund_id_idx" ON "refund_histories"("refund_id");

-- AddForeignKey
ALTER TABLE "refund_histories" ADD CONSTRAINT "refund_histories_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

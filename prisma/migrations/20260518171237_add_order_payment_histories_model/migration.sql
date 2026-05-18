-- CreateTable
CREATE TABLE "order_payment_histories" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_proof_url" TEXT NOT NULL,
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_payment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_payment_histories_order_id_idx" ON "order_payment_histories"("order_id");

-- AddForeignKey
ALTER TABLE "order_payment_histories" ADD CONSTRAINT "order_payment_histories_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

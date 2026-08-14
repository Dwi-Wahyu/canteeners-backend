-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_slots" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "quota" INTEGER NOT NULL,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "event_id" INTEGER NOT NULL,

    CONSTRAINT "event_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_usages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slot_id" INTEGER NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_seen" BOOLEAN NOT NULL DEFAULT false,
    "customer_discount_id" TEXT,

    CONSTRAINT "event_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_slots_start_time_idx" ON "event_slots"("start_time");

-- CreateIndex
CREATE INDEX "event_slots_end_time_idx" ON "event_slots"("end_time");

-- CreateIndex
CREATE UNIQUE INDEX "event_usages_user_id_key" ON "event_usages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_usages_customer_discount_id_key" ON "event_usages"("customer_discount_id");

-- AddForeignKey
ALTER TABLE "event_slots" ADD CONSTRAINT "event_slots_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_usages" ADD CONSTRAINT "event_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_usages" ADD CONSTRAINT "event_usages_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "event_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_usages" ADD CONSTRAINT "event_usages_customer_discount_id_fkey" FOREIGN KEY ("customer_discount_id") REFERENCES "customer_discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { RefundProcessor } from "./refund.processor";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "refund-queue",
    }),
    BullBoardModule.forFeature({
      name: "refund-queue",
      adapter: BullMQAdapter,
    }),
    PrismaModule,
  ],
  providers: [RefundProcessor],
  exports: [BullModule],
})
export class RefundModule {}

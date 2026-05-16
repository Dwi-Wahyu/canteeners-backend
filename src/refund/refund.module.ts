import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { RefundProcessor } from "./refund.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { FirebaseModule } from "../firebase/firebase.module";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "refund-queue",
    }),
    PrismaModule,
    FirebaseModule,
  ],
  providers: [RefundProcessor],
  exports: [BullModule],
})
export class RefundModule {}

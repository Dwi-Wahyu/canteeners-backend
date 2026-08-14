import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { OrderProcessor } from './order.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'order-queue',
    }),
    BullBoardModule.forFeature({
      name: 'order-queue',
      adapter: BullMQAdapter,
    }),
    PrismaModule,
  ],
  providers: [OrderProcessor],
  exports: [BullModule],
})
export class OrderModule {}

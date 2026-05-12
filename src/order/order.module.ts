import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrderProcessor } from './order.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'order-queue',
    }),
    PrismaModule,
  ],
  providers: [OrderProcessor],
  exports: [BullModule],
})
export class OrderModule {}

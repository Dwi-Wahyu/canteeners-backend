import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { FastifyAdapter } from '@bull-board/fastify';
import { PrismaModule } from './prisma/prisma.module';
import { FileManagerModule } from './file-manager/file-manager.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ChatModule } from './chat/chat.module';
import { OrderModule } from './order/order.module';
import { RefundModule } from './refund/refund.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: FastifyAdapter,
    }),
    PrismaModule,
    FileManagerModule,
    RealtimeModule,
    ChatModule,
    OrderModule,
    RefundModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

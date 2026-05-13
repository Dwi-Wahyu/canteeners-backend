import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FileManagerModule } from './file-manager/file-manager.module';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { OrderModule } from './order/order.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      // Lokasi folder fisik di server
      rootPath: join(process.cwd(), 'uploads'),
      // Mencegah pencarian file index.html otomatis
      // exclude: ['/api/(.*)'],
      // Prefix URL untuk mengakses file
      serveRoot: '/uploads',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'order-queue',
      adapter: BullMQAdapter,
    }),
    PrismaModule,
    FirebaseModule,
    FileManagerModule,
    OrderModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as express from 'express';
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tambahkan limit body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Protect Bull Board
  app.use(
    '/admin/queues',
    basicAuth({
      users: {
        [process.env.BULL_BOARD_USER || 'admin']:
          process.env.BULL_BOARD_PASSWORD || 'changeme',
      },
      challenge: true,
    }),
  );

  // Pastikan folder 'uploads' ada saat aplikasi dijalankan
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
    console.log('Folder uploads berhasil dibuat');
  }

  // Aktifkan CORS agar aset bisa diakses dari aplikasi client/web
  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3002, '0.0.0.0');
}
bootstrap();

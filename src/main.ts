import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import multipart from '@fastify/multipart';

async function bootstrap() {
  // Buat instance Fastify Adapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Buat folder uploads (sama seperti sebelumnya)
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
    console.log('📁 Folder uploads berhasil dibuat');
  }

  // Aktifkan CORS (Sekarang menggunakan @fastify/cors)
  app.enableCors({
    origin: '*', // Ganti dengan domain spesifik di production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Sajikan file statis dari folder uploads
  // agar bisa diakses seperti http://localhost:3002/uploads/foto.jpg
  const fastifyInstance = app.getHttpAdapter().getInstance();
  await fastifyInstance.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // Jalankan server
  const port = process.env.PORT ?? 3002;
  await app.listen(port, '0.0.0.0'); // '0.0.0.0' penting untuk akses dari luar container/local
  console.log(`🚀 Server Fastify berjalan di http://localhost:${port}`);
}
bootstrap();

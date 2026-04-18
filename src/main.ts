import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Pastikan folder 'uploads' ada saat aplikasi dijalankan
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
    console.log('📁 Folder uploads berhasil dibuat');
  }

  // Aktifkan CORS agar aset bisa diakses dari aplikasi client/web
  app.enableCors();
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();

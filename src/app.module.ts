import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FileManagerModule } from './file-manager/file-manager.module';

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
    FileManagerModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { FileManagerService } from './file-manager.service';
import { FileManagerController } from './file-manager.controller';

@Module({
  imports: [
    // Melayani file agar bisa diakses publik
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/static', // Akses via: http://localhost:3000/static/file-xxx.jpg
    }),
  ],
  controllers: [FileManagerController],
  providers: [FileManagerService],
})
export class FileManagerModule {}

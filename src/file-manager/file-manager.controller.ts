import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileManagerService } from './file-manager.service';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

@Controller('files')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      storage: diskStorage({
        // Fungsi destination sekarang bisa membaca data dari 'req.body'
        destination: (req, file, callback) => {
          // Ambil path dari body, default ke root 'uploads' jika kosong
          const subPath = req.body.path || '';
          const uploadPath = join(process.cwd(), 'uploads', subPath);

          // Buat folder secara rekursif jika belum ada
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExt = extname(file.originalname);
          callback(null, `file-${uniqueSuffix}${fileExt}`);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Body('path') subPath: string,
  ) {
    // Bersihkan path untuk response agar tidak ada double slash
    const cleanSubPath = subPath ? `${subPath}/` : '';

    return {
      message: 'Upload berhasil',
      data: {
        filename: file.filename,
        // Path akses publik
        url: `/uploads/${cleanSubPath}${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
      },
    };
  }

  @Delete(':filename')
  remove(@Param('filename') filename: string) {
    return this.fileManagerService.deleteFile(filename);
  }
}

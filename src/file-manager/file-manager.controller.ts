import {
  Controller,
  Post,
  Delete,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileManagerService } from './file-manager.service';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { promises as fs } from 'node:fs';
import type { MultipartFile } from '@fastify/multipart';

@Controller('files')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  @Post('upload')
  async uploadFile(@Req() req: any) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const subPathField = file.fields?.path;
    const subPath = subPathField ? (subPathField as any).value : '';

    const uploadPath = join(process.cwd(), 'uploads', subPath || '');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = extname(file.filename);
    const fileName = `file-${uniqueSuffix}${fileExt}`;
    const fullPath = join(uploadPath, fileName);

    await pipeline(file.file, createWriteStream(fullPath));

    const stats = await fs.stat(fullPath);

    const cleanSubPath = subPath ? `${subPath}/` : '';
    return {
      message: 'Upload berhasil',
      data: {
        filename: fileName,
        url: `/uploads/${cleanSubPath}${fileName}`,
        mimetype: file.mimetype,
        size: stats.size,
      },
    };
  }

  @Delete(':filename')
  remove(@Param('filename') filename: string) {
    return this.fileManagerService.deleteFile(filename);
  }
}

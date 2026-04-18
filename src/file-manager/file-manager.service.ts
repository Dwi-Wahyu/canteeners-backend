import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

@Injectable()
export class FileManagerService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  async deleteFile(fileName: string) {
    const filePath = join(this.uploadPath, fileName);

    if (!existsSync(filePath)) {
      throw new NotFoundException(`File ${fileName} tidak ditemukan.`);
    }

    try {
      await unlink(filePath);
      return {
        status: 'success',
        message: `File ${fileName} berhasil dihapus.`,
      };
    } catch (error) {
      throw new Error(`Gagal menghapus file: ${error.message}`);
    }
  }
}

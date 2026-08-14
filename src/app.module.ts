import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileManagerModule } from './file-manager/file-manager.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [FileManagerModule, RealtimeModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

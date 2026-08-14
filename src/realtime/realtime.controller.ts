import { Body, Controller, Post } from '@nestjs/common';
import { RealtimeServer } from './realtime.server';

@Controller('internal')
export class RealtimeController {
  constructor(private realtime: RealtimeServer) {}

  @Post('publish')
  publish(@Body() body: { topic: string; data: any }) {
    if (body.topic && body.data) {
      this.realtime.publish(body.topic, body.data);
    }
    return { success: true };
  }
}

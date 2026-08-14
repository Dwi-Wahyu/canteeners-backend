import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('admin/queues')
  redirectToQueues(@Res() res: any) {
    return res.redirect('/admin/queues/', 302);
  }
}

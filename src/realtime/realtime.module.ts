import { Global, Module, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RealtimeServer } from './realtime.server';
import { RealtimeController } from './realtime.controller';
import { OrderRealtimeListener } from './order-realtime.listener';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [RealtimeController],
  providers: [
    {
      provide: RealtimeServer,
      useFactory: () => new RealtimeServer(),
    },
    OrderRealtimeListener,
  ],
  exports: [RealtimeServer],
})
export class RealtimeModule implements OnApplicationBootstrap {
  constructor(private readonly realtime: RealtimeServer) {}

  onApplicationBootstrap() {
    const wsPort = parseInt(process.env.WS_PORT ?? '3003');
    this.realtime.start(wsPort);
  }
}

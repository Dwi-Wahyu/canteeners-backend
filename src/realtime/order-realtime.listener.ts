import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeServer } from './realtime.server';

export interface OrderStatusChangedEvent {
  orderId: string;
  status: string;
  customerId: string;
  shopId: string;
  title?: string;
  body?: string;
}

@Injectable()
export class OrderRealtimeListener {
  constructor(private realtime: RealtimeServer) {}

  @OnEvent('order.status.changed')
  handleOrderStatusChanged(payload: OrderStatusChangedEvent) {
    this.realtime.publish(`order:${payload.orderId}`, { event: 'order:update', ...payload });
    this.realtime.publish(`shop:${payload.shopId}`, { event: 'shop:order-update', ...payload });
    this.realtime.publish(`user:${payload.customerId}`, {
      event: 'notification',
      notification: {
        type: 'ORDER',
        subtype: payload.status,
        title: payload.title || 'Update Pesanan',
        body: payload.body || `Status pesanan Anda telah diperbarui menjadi ${payload.status}`,
        data: payload,
      },
    });
  }
}

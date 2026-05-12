import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('order-queue')
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'cancel-unpaid-order':
        return await this.handleCancelUnpaidOrder(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCancelUnpaidOrder(job: Job<any>) {
    const { orderId } = job.data;
    this.logger.log(`Checking order ${orderId} for automatic cancellation...`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      this.logger.error(`Order ${orderId} not found`);
      return;
    }

    // KONDISI PENGAMAN: Cek status order saat ini.
    // 1. Status WAITING_PAYMENT (untuk non-CASH)
    // 2. Status WAITING_SHOP_CONFIRMATION dengan method CASH (karena belum bayar di kedai)
    const isWaitingNonCash = order.status === 'WAITING_PAYMENT';
    const isWaitingCash =
      order.status === 'WAITING_SHOP_CONFIRMATION' &&
      order.payment_method === 'CASH' &&
      !order.payment_proof_url;

    if (!isWaitingNonCash && !isWaitingCash) {
      this.logger.log(
        `Order ${orderId} is safe (status: ${order.status}, method: ${order.payment_method}). Skipping cancellation.`,
      );
      return;
    }

    this.logger.log(`Order ${orderId} is still unpaid. Cancelling...`);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelled_reason: 'Melewati batas waktu pembayaran 15 menit',
      },
    });

    this.logger.log(`Order ${orderId} has been successfully cancelled.`);
    return updatedOrder;
  }
}

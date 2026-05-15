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
      case 'auto-refund-unconfirmed-payment':
        return await this.handleAutoRefundUnconfirmedPayment(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleAutoRefundUnconfirmedPayment(job: Job<any>) {
    const { orderId } = job.data;
    this.logger.log(`Checking order ${orderId} for automatic refund...`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!order) {
      this.logger.error(`Order ${orderId} not found`);
      return;
    }

    // Hanya proses jika status masih WAITING_SHOP_CONFIRMATION
    if (order.status !== 'WAITING_SHOP_CONFIRMATION') {
      this.logger.log(
        `Order ${orderId} status is ${order.status}. Skipping auto-refund.`,
      );
      return;
    }

    // Pastikan ada bukti pembayaran (untuk transfer) atau memang CASH yang butuh konfirmasi
    if (order.payment_method !== 'CASH' && !order.payment_proof_url) {
      this.logger.log(
        `Order ${orderId} has no payment proof for non-cash method. Skipping auto-refund.`,
      );
      return;
    }

    this.logger.log(
      `Order ${orderId} was not confirmed by shop in 30 minutes. Cancelling and creating refund...`,
    );

    await this.prisma.$transaction(async (tx) => {
      // 1. Update status order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelled_reason:
            'Pesanan dibatalkan otomatis karena pemilik kedai tidak mengonfirmasi pembayaran tepat waktu (30 menit).',
          cancelled_by_id: 'SYSTEM',
        },
      });

      // 2. Buat record refund (hanya jika non-CASH atau ada bukti pembayaran)
      // Note: Jika CASH dan belum bayar (no proof), biasanya dicancel tanpa refund.
      // Tapi request user bilang "seluruh total harga keranjang", asumsikan ini untuk yang sudah bayar.
      if (order.payment_proof_url || order.payment_method !== 'CASH') {
        await tx.refund.create({
          data: {
            order_id: orderId,
            amount: order.total_price,
            reason: 'SHOP_CANCELLATION',
            status: 'PENDING',
            description:
              'Pemilik kedai tidak mengonfirmasi pembayaran dalam batas waktu 30 menit. Pesanan dibatalkan otomatis dan pengembalian dana sedang diverifikasi. Silakan hubungi layanan pelanggan jika Anda memiliki pertanyaan.',
            disbursement_mode:
              order.payment_method === 'CASH' ? 'CASH' : 'TRANSFER',
          },
        });
        this.logger.log(`Refund record created for order ${orderId}.`);
      }
    });

    this.logger.log(
      `Order ${orderId} has been successfully cancelled and refund initiated.`,
    );
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

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Update status order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelled_reason:
            'Batas waktu pembayaran berakhir, pesanan dibatalkan otomatis oleh sistem dan tercatat sebagai pelanggaran.',
          cancelled_by_id: 'SYSTEM',
        },
      });

      // 2. Catat pelanggaran
      await tx.customerViolation.create({
        data: {
          customer_id: order.customer_id,
          order_id: orderId,
          timestamp: new Date(),
          type: 'ORDER_CANCEL_WITHOUT_PAY',
        },
      });

      // 3. Cek apakah sudah mencapai batas 3 pelanggaran hari ini
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayViolationCount = await tx.customerViolation.count({
        where: {
          customer_id: order.customer_id,
          type: 'ORDER_CANCEL_WITHOUT_PAY',
          timestamp: {
            gte: startOfDay,
          },
        },
      });

      if (todayViolationCount >= 3) {
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + 1); // Bekukan 24 jam

        await tx.customer.update({
          where: { id: order.customer_id },
          data: {
            suspend_until: suspendUntil,
            suspend_reason:
              'Akun dibekukan sementara karena pembatalan pesanan otomatis yang berulang (3x hari ini).',
          },
        });
        this.logger.log(`Customer ${order.customer_id} has been suspended.`);
      }

      return updated;
    });

    this.logger.log(`Order ${orderId} has been successfully cancelled.`);
    return updatedOrder;
  }
}

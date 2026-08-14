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
      case 'auto-reject-unconfirmed-order':
        return await this.handleAutoRejectUnconfirmedOrder(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  /**
   * Menangani auto refund jika kedai tidak mengonfirmasi pembayaran dalam batas waktu (default: 30 menit)
   */
  private async handleAutoRefundUnconfirmedPayment(job: Job<any>) {
    const { orderId } = job.data;
    this.logger.log(`Checking order ${orderId} for automatic refund...`);

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
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
        return null;
      }

      // Hanya proses jika status masih WAITING_SHOP_CONFIRMATION
      if (order.status !== 'WAITING_SHOP_CONFIRMATION') {
        this.logger.log(
          `Order ${orderId} status is ${order.status}. Skipping auto-refund.`,
        );
        return null;
      }

      // Pastikan ada bukti pembayaran (untuk transfer) atau memang CASH yang butuh konfirmasi
      if (order.payment_method !== 'CASH' && !order.payment_proof_url) {
        this.logger.log(
          `Order ${orderId} has no payment proof for non-cash method. Skipping auto-refund.`,
        );
        return null;
      }

      this.logger.log(
        `Order ${orderId} was not confirmed by shop in time. Cancelling and creating refund...`,
      );

      // 1. Update status order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelled_reason:
            'Pesanan dibatalkan otomatis karena pemilik kedai tidak mengonfirmasi pembayaran tepat waktu.',
          cancelled_by_id: 'SYSTEM',
        },
      });

      // 2. Buat record refund (hanya jika non-CASH atau ada bukti pembayaran)
      if (order.payment_proof_url || order.payment_method !== 'CASH') {
        await tx.refund.create({
          data: {
            order_id: orderId,
            amount: order.total_price,
            reason: 'SHOP_CANCELLATION',
            status: 'PENDING',
            description:
              'Pemilik kedai tidak mengonfirmasi pembayaran dalam batas waktu. Pesanan dibatalkan otomatis dan pengembalian dana sedang diverifikasi.',
            disbursement_mode:
              order.payment_method === 'CASH' ? 'CASH' : 'TRANSFER',
          },
        });
        this.logger.log(`Refund record created for order ${orderId}.`);
      }
      return order;
    });

    if (result) {
      this.logger.log(
        `Order ${orderId} has been successfully cancelled and refund initiated.`,
      );
    }
    return result;
  }

  /**
   * Menangani auto rejection jika kedai tidak menerima pesanan baru dalam batas waktu (default: 10 menit)
   */
  private async handleAutoRejectUnconfirmedOrder(job: Job<any>) {
    const { orderId } = job.data;
    this.logger.log(
      `Checking order ${orderId} for automatic rejection due to shop inaction...`,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return null;
      }

      // Hanya proses jika status masih PENDING_CONFIRMATION
      if (order.status !== 'PENDING_CONFIRMATION') {
        this.logger.log(
          `Order ${orderId} status is ${order.status}. Skipping auto-rejection.`,
        );
        return null;
      }

      this.logger.log(
        `Order ${orderId} was not confirmed by shop. Rejecting automatically...`,
      );

      // 1. Update status order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          rejected_reason:
            'Pesanan ditolak otomatis oleh sistem karena kedai tidak merespons pesanan tepat waktu.',
        },
      });

      return updated;
    });

    if (result) {
      this.logger.log(
        `Order ${orderId} has been successfully rejected due to shop inaction.`,
      );
    }
    return result;
  }

  /**
   * Menangani pembatalan pesanan yang belum dibayar dalam batas waktu (default: 15 menit + buffer)
   */
  private async handleCancelUnpaidOrder(job: Job<any>) {
    const { orderId } = job.data;
    this.logger.log(`Checking order ${orderId} for automatic cancellation...`);

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return null;
      }

      // KONDISI PENGAMAN: Cek status order saat ini.
      // 1. Status WAITING_PAYMENT (untuk non-CASH)
      // 2. Status WAITING_SHOP_CONFIRMATION dengan method CASH (karena belum bayar di kedai)
      const isWaitingNonCash =
        order.status === 'WAITING_PAYMENT' ||
        order.status === 'PAYMENT_REJECTED';
      const isWaitingCash =
        order.status === 'WAITING_SHOP_CONFIRMATION' &&
        order.payment_method === 'CASH' &&
        !order.payment_proof_url;

      if (!isWaitingNonCash && !isWaitingCash) {
        this.logger.log(
          `Order ${orderId} is safe (status: ${order.status}, method: ${order.payment_method}). Skipping cancellation.`,
        );
        return null;
      }

      this.logger.log(`Order ${orderId} is still unpaid. Cancelling...`);

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

    if (result) {
      this.logger.log(`Order ${orderId} has been successfully cancelled.`);
    }
    return result;
  }
}

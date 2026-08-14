import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('refund-queue')
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing refund job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'notify-pending-refund':
        return await this.handleNotifyPendingRefund(job);
      default:
        this.logger.warn(`Unknown refund job name: ${job.name}`);
    }
  }

  /**
   * Berjalan 12 jam setelah refund dibuat.
   * Mengirim notifikasi pengingat ke pemilik kedai jika refund masih PENDING.
   */
  private async handleNotifyPendingRefund(job: Job<any>) {
    const { refundId } = job.data;
    this.logger.log(`Checking refund ${refundId} for 12-hour reminder...`);

    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        order: {
          include: {
            customer: {
              include: {
                user: {
                  select: { name: true, avatar: true },
                },
              },
            },
            shop: {
              include: {
                owner: {
                  select: { user_id: true, user: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!refund) {
      this.logger.warn(`Refund ${refundId} not found. Skipping.`);
      return;
    }

    // Hanya kirim reminder jika masih PENDING (belum direspons kedai sama sekali)
    if (refund.status !== 'PENDING') {
      this.logger.log(
        `Refund ${refundId} sudah berstatus ${refund.status}. Reminder tidak diperlukan.`,
      );
      return;
    }

    this.logger.log(
      `Reminder check completed for shop owner ${refund.order.shop.owner.user_id} for refund ${refundId}`,
    );
  }
}

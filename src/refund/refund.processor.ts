import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { Logger } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';

@Processor('refund-queue')
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {
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
   * Syarat & ketentuan: kedai harus merespons dalam 1x24 jam.
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

    const db = this.firebase.getDb();
    const shopOwnerUserId = refund.order.shop.owner.user_id;
    const customerName = refund.order.customer.user.name;
    const orderId = refund.order_id;

    // 1. Kirim notifikasi ke pemilik kedai
    const notificationRef = db.collection('notifications');
    await notificationRef.add({
      recipientId: shopOwnerUserId,
      type: 'REFUND',
      subType: 'REMINDER',
      title: '⏰ Pengingat: Refund Menunggu Respons Anda',
      body: `Permintaan refund dari ${customerName} sudah menunggu lebih dari 12 jam. Anda memiliki waktu tersisa sekitar 12 jam lagi sesuai ketentuan (batas 1x24 jam). Segera tinjau dan berikan keputusan.`,
      isRead: false,
      intent: 'WARNING',
      resourcePath: `/dashboard-kedai/order/${orderId}/refund`,
      createdAt: FieldValue.serverTimestamp(),
      senderInfo: {
        name: customerName,
        avatar: refund.order.customer.user.avatar ?? null,
      },
      metadata: {
        refundId: refund.id,
        amount: refund.amount,
        reason: refund.reason,
        hoursElapsed: 12,
      },
    });

    // 2. Update Firestore refund doc: tandai reminder sudah dikirim
    try {
      const refundDocRef = db.collection('refunds').doc(refundId);
      await refundDocRef.update({
        reminderSentAt: FieldValue.serverTimestamp(),
        lastUpdatedAt: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      // Dokumen mungkin belum ada (edge case) — tidak fatal
      this.logger.warn(
        `Could not update Firestore refund doc ${refundId}: ${err}`,
      );
    }

    this.logger.log(
      `Reminder notification sent to shop owner ${shopOwnerUserId} for refund ${refundId}`,
    );
  }
}

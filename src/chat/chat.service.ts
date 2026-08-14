import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeServer } from '../realtime/realtime.server';
import { SendMessageDto, CreateChatDto } from './chat.dto';
import { MessageType, ChatType } from '@prisma/client';

export function orderParticipants(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

const PARTICIPANT_INCLUDE = {
  include: {
    owner: {
      include: {
        shop: true,
      },
    },
  },
};

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeServer,
  ) {}

  async getOrCreateChat(currentUserId: string, dto: CreateChatDto) {
    let targetUserId = dto.target_user_id;

    if (dto.shop_id && !targetUserId) {
      const shop = await this.prisma.shop.findUnique({
        where: { id: dto.shop_id },
        select: { owner: { select: { user_id: true } } },
      });
      if (shop?.owner) targetUserId = shop.owner.user_id;
    }

    if (dto.owner_id && !targetUserId) {
      const owner = await this.prisma.owner.findUnique({ where: { id: dto.owner_id } });
      if (owner) targetUserId = owner.user_id;
      else targetUserId = dto.owner_id;
    }

    if (dto.customer_id && !targetUserId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customer_id } });
      if (customer) targetUserId = customer.user_id;
      else targetUserId = dto.customer_id;
    }

    if (!targetUserId) {
      throw new BadRequestException('Target user ID could not be resolved');
    }

    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot start a chat with yourself');
    }

    const type = dto.type || ChatType.CUSTOMER_OWNER;
    const contextId = dto.context_id ?? null;

    const [participant_one_id, participant_two_id] = orderParticipants(currentUserId, targetUserId);

    let chat = await this.prisma.chat.findFirst({
      where: {
        participant_one_id,
        participant_two_id,
        type,
        context_id: contextId ?? null,
      },
      include: {
        participant_one: PARTICIPANT_INCLUDE,
        participant_two: PARTICIPANT_INCLUDE,
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          participant_one_id,
          participant_two_id,
          type,
          context_id: contextId ?? undefined,
          unread_counts: {},
        },
        include: {
          participant_one: PARTICIPANT_INCLUDE,
          participant_two: PARTICIPANT_INCLUDE,
        },
      });
    }

    return chat;
  }

  async listUserChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { participant_one_id: userId },
          { participant_two_id: userId },
        ],
      },
      include: {
        participant_one: PARTICIPANT_INCLUDE,
        participant_two: PARTICIPANT_INCLUDE,
      },
      orderBy: { updated_at: 'desc' },
    });

    return chats;
  }

  async listMessages(chatId: string, cursor?: string, limit = 50) {
    const messages = await this.prisma.message.findMany({
      where: { chat_id: chatId },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { created_at: 'asc' },
    });
    return messages;
  }

  async createMessage(chatId: string, senderUserId: string, dto: SendMessageDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participant_one: true,
        participant_two: true,
      },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    const senderId = senderUserId;
    const opponentUserId =
      chat.participant_one_id === senderUserId
        ? chat.participant_two_id
        : chat.participant_one_id;

    const currentUnread = (chat.unread_counts as Record<string, number>) || {};
    const updatedUnread = {
      ...currentUnread,
      [opponentUserId]: (currentUnread[opponentUserId] || 0) + 1,
    };

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          chat_id: chatId,
          sender_id: senderId,
          text: dto.text ?? null,
          type: dto.type || MessageType.TEXT,
          attachments: dto.attachments ?? [],
          order_id: dto.order_id ?? null,
          read_by: [senderId],
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: {
          last_message: dto.text ?? (dto.type === 'ATTACHMENT' ? 'Mengirim lampiran' : 'Mengirim pesan'),
          last_message_at: new Date(),
          last_message_type: dto.type || MessageType.TEXT,
          last_message_sender_id: senderId,
          unread_counts: updatedUnread,
        },
      });

      return msg;
    });

    const senderUser = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, avatar: true },
    });

    this.realtime.publish(`chat:${chatId}`, { event: 'chat:message', message });
    this.realtime.publish(`user:${opponentUserId}`, {
      event: 'chat:new-message',
      chatId,
      message,
      senderName: senderUser?.name ?? 'Pengirim',
      senderAvatar: senderUser?.avatar ?? 'avatars/default-avatar.jpg',
    });

    return message;
  }

  async markRead(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    const currentUnread = (chat.unread_counts as Record<string, number>) || {};
    const updatedUnread = { ...currentUnread, [userId]: 0 };

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { unread_counts: updatedUnread },
    });

    await this.prisma.message.updateMany({
      where: { 
        chat_id: chatId,
        sender_id: { not: userId },
      },
      data: {
        read_by: { push: userId }
      }
    });

    this.realtime.publish(`chat:${chatId}`, { event: 'chat:read', userId });

    return { success: true };
  }

  async getChatById(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participant_one: PARTICIPANT_INCLUDE,
        participant_two: PARTICIPANT_INCLUDE,
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async deleteChat(chatId: string) {
    await this.prisma.chat.delete({ where: { id: chatId } });
    return { success: true };
  }
}

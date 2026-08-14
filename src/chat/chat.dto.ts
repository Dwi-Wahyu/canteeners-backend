import { MessageType, ChatType } from '@prisma/client';

export class SendMessageDto {
  text?: string;
  type?: MessageType;
  attachments?: any;
  order_id?: string;
}

export class CreateChatDto {
  target_user_id?: string;
  customer_id?: string;
  owner_id?: string;
  shop_id?: string;
  type?: ChatType;
  context_id?: string;
}

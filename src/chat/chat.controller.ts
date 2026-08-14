import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto } from './chat.dto';
import { JwtAuthGuard, AuthUser } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listUserChats(@CurrentUser() user: AuthUser) {
    return this.chatService.listUserChats(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createChat(@CurrentUser() user: AuthUser, @Body() dto: CreateChatDto) {
    return this.chatService.getOrCreateChat(user.id, dto);
  }

  @Get(':chatId')
  @UseGuards(JwtAuthGuard)
  getChat(@Param('chatId') chatId: string) {
    return this.chatService.getChatById(chatId);
  }

  @Get(':chatId/messages')
  getMessages(
    @Param('chatId') chatId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.listMessages(chatId, cursor, limit ? parseInt(limit) : 50);
  }

  @Post(':chatId/messages')
  @UseGuards(JwtAuthGuard)
  sendMessage(
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.createMessage(chatId, user.id, dto);
  }

  @Post(':chatId/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('chatId') chatId: string, @CurrentUser() user: AuthUser) {
    return this.chatService.markRead(chatId, user.id);
  }

  @Delete(':chatId')
  @UseGuards(JwtAuthGuard)
  deleteChat(@Param('chatId') chatId: string) {
    return this.chatService.deleteChat(chatId);
  }
}

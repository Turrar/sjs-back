import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateMessageBodyDto } from './dto/create-message.dto';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('applications/:applicationId/messages')
  listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.chat.listMessages(applicationId, user.sub);
  }

  @Post('applications/:applicationId/messages')
  postMessage(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateMessageBodyDto,
  ) {
    return this.chat.createMessage(user.sub, applicationId, dto.body);
  }
}

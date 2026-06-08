import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { AdminGuard } from '@/auth/admin.guard';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import type { User } from '@/generated/prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { EventsService } from './events.service';

type AuthenticatedRequest = Request & {
  user?: User | { id: string; phoneE164?: string | null };
};

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier un événement (admin)' })
  @ApiBody({ type: CreateEventDto })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEventDto,
  ) {
    const user = req.user;
    const userId =
      user && typeof user === 'object' && 'id' in user ? user.id : undefined;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.eventsService.createEvent(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les événements publiés' })
  async list(@Query() query: ListEventsQueryDto) {
    return this.eventsService.listEvents(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer le détail d’un événement' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.eventsService.getEventById(id);
  }
}

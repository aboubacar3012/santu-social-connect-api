import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';

type EventLink = { label: string; url: string };

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(organizerId: string, dto: CreateEventDto) {
    const schedule = this.parseSchedule(dto);

    const event = await this.prisma.event.create({
      data: {
        organizerId,
        title: dto.title.trim(),
        type: dto.type,
        imageUrl: this.emptyToNull(dto.imageUrl),
        description: this.emptyToNull(dto.description),
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        isAllDay: schedule.isAllDay,
        address: dto.address.trim(),
        links: (dto.links ?? []) as unknown as Prisma.InputJsonValue,
        status: dto.status ?? EventStatus.published,
      },
      include: { organizer: true },
    });

    return { event: this.toEventResponse(event) };
  }

  async listEvents(query: ListEventsQueryDto) {
    const where: Prisma.EventWhereInput = {
      status: EventStatus.published,
    };

    if (query.type) {
      where.type = query.type;
    }
    if (query.dateFrom || query.dateTo) {
      where.startsAt = {};
      if (query.dateFrom) {
        where.startsAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.startsAt.lte = new Date(query.dateTo);
      }
    }

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: { organizer: true },
    });

    return { events: events.map((event) => this.toEventResponse(event)) };
  }

  async listMyEvents(organizerId: string) {
    const events = await this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { startsAt: 'desc' },
      include: { organizer: true },
    });

    return { events: events.map((event) => this.toEventResponse(event)) };
  }

  async updateEvent(eventId: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      throw new NotFoundException('Événement introuvable');
    }

    const data: Prisma.EventUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }
    if (dto.type !== undefined) {
      data.type = dto.type;
    }
    if (dto.imageUrl !== undefined) {
      data.imageUrl = this.emptyToNull(dto.imageUrl);
    }
    if (dto.description !== undefined) {
      data.description = this.emptyToNull(dto.description);
    }
    if (
      dto.startsAt !== undefined ||
      dto.endsAt !== undefined ||
      dto.isAllDay !== undefined
    ) {
      const schedule = this.parseSchedule({
        startsAt: dto.startsAt ?? existing.startsAt.toISOString(),
        endsAt:
          dto.endsAt !== undefined
            ? dto.endsAt
            : existing.endsAt?.toISOString(),
        isAllDay: dto.isAllDay !== undefined ? dto.isAllDay : existing.isAllDay,
      });
      data.startsAt = schedule.startsAt;
      data.endsAt = schedule.endsAt;
      data.isAllDay = schedule.isAllDay;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.address !== undefined) {
      data.address = dto.address.trim();
    }
    if (dto.links !== undefined) {
      data.links = dto.links as unknown as Prisma.InputJsonValue;
    }

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data,
      include: { organizer: true },
    });

    return { event: this.toEventResponse(event) };
  }

  async deleteEvent(eventId: string) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing) {
      throw new NotFoundException('Événement introuvable');
    }

    await this.prisma.event.delete({ where: { id: eventId } });

    return { success: true };
  }

  async getEventById(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: true },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    return { event: this.toEventResponse(event) };
  }

  private toEventResponse(event: {
    id: string;
    title: string;
    type: string;
    imageUrl: string | null;
    description: string | null;
    startsAt: Date;
    endsAt: Date | null;
    isAllDay: boolean;
    address: string;
    links: unknown;
    status: string;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
    organizer?: unknown;
  }) {
    const startsAtDate = event.startsAt;
    const endsAtDate = event.endsAt;
    const links = this.parseLinks(event.links);
    const isAllDay = event.isAllDay;

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      image: event.imageUrl ?? '',
      description: event.description ?? '',
      date: this.toDateParts(startsAtDate),
      time: isAllDay ? '' : this.formatTime(startsAtDate),
      endDate: endsAtDate ? this.toDateParts(endsAtDate) : null,
      endTime: endsAtDate && !isAllDay ? this.formatTime(endsAtDate) : null,
      isAllDay,
      address: event.address,
      links,
      startsAt: startsAtDate.getTime(),
      endsAt: endsAtDate?.getTime() ?? null,
      status: event.status,
      organizerId: event.organizerId,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  private parseSchedule(dto: {
    startsAt: string;
    endsAt?: string;
    isAllDay?: boolean;
  }) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Date de début invalide');
    }

    const isAllDay = dto.isAllDay === true;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;

    if (endsAt && Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Date de fin invalide');
    }
    if (endsAt && endsAt.getTime() < startsAt.getTime()) {
      throw new BadRequestException(
        'La date de fin doit être postérieure au début',
      );
    }

    return { startsAt, endsAt, isAllDay };
  }

  private toDateParts(date: Date) {
    return {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  }

  private parseLinks(links: unknown): EventLink[] {
    if (!Array.isArray(links)) return [];
    return links.filter(
      (link): link is EventLink =>
        typeof link === 'object' &&
        link !== null &&
        'label' in link &&
        'url' in link &&
        typeof (link as EventLink).label === 'string' &&
        typeof (link as EventLink).url === 'string',
    );
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private emptyToNull(value?: string) {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
}

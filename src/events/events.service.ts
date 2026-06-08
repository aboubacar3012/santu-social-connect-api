import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';

type EventLink = { label: string; url: string };

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(organizerId: string, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        organizerId,
        title: dto.title.trim(),
        type: dto.type,
        imageUrl: this.emptyToNull(dto.imageUrl),
        description: this.emptyToNull(dto.description),
        startsAt: new Date(dto.startsAt),
        address: dto.address.trim(),
        links: (dto.links ?? []) as unknown as Prisma.InputJsonValue,
        status: EventStatus.published,
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
    address: string;
    links: unknown;
    status: string;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
    organizer?: unknown;
  }) {
    const startsAtDate = event.startsAt;
    const links = this.parseLinks(event.links);

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      image: event.imageUrl ?? '',
      description: event.description ?? '',
      date: {
        day: startsAtDate.getDate(),
        month: startsAtDate.getMonth() + 1,
        year: startsAtDate.getFullYear(),
      },
      time: this.formatTime(startsAtDate),
      address: event.address,
      links,
      startsAt: startsAtDate.getTime(),
      status: event.status,
      organizerId: event.organizerId,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { EventStatus, EventType } from '../../generated/prisma/client';

export class EventLinkDto {
  @ApiProperty({ example: 'Billetterie' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: 'https://example.com/event' })
  @IsUrl()
  @MaxLength(2048)
  url!: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Afterwork fondateurs — Vieux-Port' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: EventType, example: EventType.afterwork })
  @IsEnum(EventType)
  type!: EventType;

  @ApiPropertyOptional({
    description: 'URL de l’image (après upload presign).',
    example: 'https://cdn.example.com/events/photo.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'Rencontre informelle entre fondateurs marseillais.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'Date et heure de début (ISO 8601).',
    example: '2026-06-12T19:00:00.000Z',
  })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional({
    description: 'Date et heure de fin (ISO 8601). Obligatoire pour les événements multi-jours ou avec plage horaire.',
    example: '2026-06-14T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({
    description: 'Événement sur la journée entière (sans heure précise).',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    enum: EventStatus,
    description: 'État de publication. Par défaut : published.',
    example: EventStatus.published,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({ example: '12 Quai du Port, 13002 Marseille' })
  @IsString()
  @MaxLength(500)
  address!: string;

  @ApiPropertyOptional({ type: [EventLinkDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => EventLinkDto)
  links?: EventLinkDto[];
}

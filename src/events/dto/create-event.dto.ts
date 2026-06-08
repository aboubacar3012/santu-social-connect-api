import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { EventType } from '@/generated/prisma/client';

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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Types MIME autorisés pour l’upload direct (PUT) vers S3. */
export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
] as const;

export type AllowedUploadContentType =
  (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number];

export class PresignUploadDto {
  @ApiProperty({
    example: 'image/jpeg',
    description:
      'Type MIME du fichier à envoyer (doit correspondre au header Content-Type du PUT).',
    enum: ALLOWED_UPLOAD_CONTENT_TYPES,
  })
  @IsString()
  @IsIn([...ALLOWED_UPLOAD_CONTENT_TYPES])
  contentType!: AllowedUploadContentType;

  @ApiPropertyOptional({
    example: 'photo-profil.jpg',
    description: 'Nom d’origine (pour l’extension du fichier côté S3).',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fileName?: string;
}

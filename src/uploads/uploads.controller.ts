import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { User } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadsService } from './uploads.service';

type AuthedRequest = Request & { user?: User | { id: string } };

@Controller('uploads')
@ApiTags('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'URL pré-signée PUT vers S3',
    description:
      'Retourne une URL temporaire pour envoyer le fichier en PUT (corps binaire), avec le même Content-Type que le champ `contentType`. Ensuite enregistrer `fileUrl` (ou `key`) côté client / base.',
  })
  async presign(@Req() req: AuthedRequest, @Body() dto: PresignUploadDto) {
    const u = req.user;
    const id = u && typeof u === 'object' && 'id' in u ? u.id : undefined;
    if (!id) {
      throw new UnauthorizedException();
    }
    return this.uploadsService.createPresignedPut(id, dto);
  }
}

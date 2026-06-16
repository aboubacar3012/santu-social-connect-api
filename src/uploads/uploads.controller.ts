import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import type { User } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadsService } from './uploads.service';

type AuthedRequest = Request & { user?: User | { id: string } };

type UploadedMulterFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

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

  @Post('file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload fichier via l’API (navigateur)',
    description:
      'Envoie le binaire au backend qui le dépose sur S3. À privilégier côté web pour éviter les blocages CORS du PUT direct vers S3.',
  })
  async uploadFile(
    @Req() req: AuthedRequest,
    @UploadedFile() file: UploadedMulterFile | undefined,
  ) {
    const u = req.user;
    const id = u && typeof u === 'object' && 'id' in u ? u.id : undefined;
    if (!id) {
      throw new UnauthorizedException();
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis.');
    }

    return this.uploadsService.uploadFileBuffer(
      id,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }
}

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  type AllowedUploadContentType,
  type PresignUploadDto,
} from './dto/presign-upload.dto';

const PRESIGN_EXPIRES_SEC = 15 * 60;

function safeSegment(name: string): string {
  const base = name
    .replace(/^.*[/\\]/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  return base.length ? base : 'file';
}

function extensionFromFileName(fileName: string): string {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(fileName);
  return m ? `.${m[1].toLowerCase()}` : '';
}

function defaultExtensionForMime(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
  };
  return map[contentType] ?? '.bin';
}

/** Ajoute `https://` si la base publique est un hôte sans schéma (ex. CloudFront). */
function normalizePublicBaseUrl(publicBase: string): string {
  const trimmed = publicBase.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

/** Construit l’URL publique à partir de `AWS_S3_PUBLIC_BASE_URL` + clé objet. */
function buildPublicFileUrl(publicBase: string, key: string): string {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  const base = normalizePublicBaseUrl(publicBase);
  return `${base}/${encoded}`;
}

function normalizeContentType(raw: string): AllowedUploadContentType | null {
  const t = raw.split(';')[0]?.trim().toLowerCase() ?? '';
  if (t === 'image/jpg') return 'image/jpeg';
  if ((ALLOWED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(t)) {
    return t as AllowedUploadContentType;
  }
  return null;
}

function buildObjectKey(
  userId: string,
  contentType: AllowedUploadContentType,
  fileName?: string,
): string {
  const name = fileName?.trim() ? safeSegment(fileName) : 'file';
  const ext =
    extensionFromFileName(name) || defaultExtensionForMime(contentType);
  return `uploads/${userId}/${randomUUID()}${ext}`;
}

@Injectable()
export class UploadsService {
  private readonly client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly region: string | undefined;
  private readonly publicBase: string | undefined;

  constructor() {
    this.region = process.env.AWS_REGION?.trim();
    this.bucket = process.env.AWS_S3_BUCKET?.trim();
    this.publicBase = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

    if (!this.region || !this.bucket || !accessKeyId || !secretAccessKey) {
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async createPresignedPut(userId: string, dto: PresignUploadDto) {
    if (!this.client || !this.bucket || !this.region) {
      throw new BadRequestException(
        'Stockage fichier non configuré (AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).',
      );
    }
    if (!this.publicBase?.trim()) {
      throw new BadRequestException(
        'AWS_S3_PUBLIC_BASE_URL est requis (URL de base CloudFront / CDN pour les fichiers publics).',
      );
    }

    const client = this.client;
    const bucket = this.bucket;
    const publicBase = this.publicBase.trim();

    const key = buildObjectKey(userId, dto.contentType, dto.fileName);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    try {
      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: PRESIGN_EXPIRES_SEC,
      });
      const fileUrl = buildPublicFileUrl(publicBase, key);

      return {
        uploadUrl,
        key,
        fileUrl,
        expiresIn: PRESIGN_EXPIRES_SEC,
        contentType: dto.contentType,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur S3';
      throw new InternalServerErrorException(
        `Pré-signature S3 impossible : ${msg}`,
      );
    }
  }

  async uploadFileBuffer(
    userId: string,
    buffer: Buffer,
    contentType: string,
    fileName?: string,
  ) {
    const normalized = normalizeContentType(contentType);
    if (!normalized) {
      throw new BadRequestException(
        `Type MIME non supporté. Types acceptés : ${ALLOWED_UPLOAD_CONTENT_TYPES.join(
          ', ',
        )}`,
      );
    }

    if (!this.client || !this.bucket || !this.region) {
      throw new BadRequestException(
        'Stockage fichier non configuré (AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).',
      );
    }
    if (!this.publicBase?.trim()) {
      throw new BadRequestException(
        'AWS_S3_PUBLIC_BASE_URL est requis (URL de base CloudFront / CDN pour les fichiers publics).',
      );
    }

    const client = this.client;
    const bucket = this.bucket;
    const publicBase = this.publicBase.trim();
    const key = buildObjectKey(userId, normalized, fileName);

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: normalized,
        }),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur S3';
      throw new InternalServerErrorException(`Upload S3 impossible : ${msg}`);
    }

    return {
      key,
      fileUrl: buildPublicFileUrl(publicBase, key),
      contentType: normalized,
    };
  }
}

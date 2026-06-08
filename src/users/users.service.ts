import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '../generated/prisma/client';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

function emptyToNull(s: string | null | undefined): string | null | undefined {
  if (s === undefined) return undefined;
  if (s === null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      data.firstName = emptyToNull(dto.firstName) ?? null;
    }
    if (dto.lastName !== undefined) {
      data.lastName = emptyToNull(dto.lastName) ?? null;
    }
    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth =
        dto.dateOfBirth === null || dto.dateOfBirth === ''
          ? null
          : new Date(dto.dateOfBirth);
    }
    if (dto.email !== undefined) {
      const next = emptyToNull(dto.email);
      if (next !== null && next !== existing.email) {
        const taken = await this.prisma.user.findFirst({
          where: { email: next, NOT: { id: userId } },
        });
        if (taken) {
          throw new ConflictException('Cette adresse e-mail est déjà utilisée');
        }
        data.emailVerified = false;
      }
      data.email = next;
    }

    if (dto.profilePicture !== undefined) {
      data.profilePicture =
        typeof dto.profilePicture === 'string' &&
        dto.profilePicture.trim() === ''
          ? null
          : dto.profilePicture;
    }
    if (dto.identityVerificationDocumentFront !== undefined) {
      data.identityVerificationDocumentFront =
        typeof dto.identityVerificationDocumentFront === 'string' &&
        dto.identityVerificationDocumentFront.trim() === ''
          ? null
          : dto.identityVerificationDocumentFront;
    }
    if (dto.identityVerificationDocumentBack !== undefined) {
      data.identityVerificationDocumentBack =
        typeof dto.identityVerificationDocumentBack === 'string' &&
        dto.identityVerificationDocumentBack.trim() === ''
          ? null
          : dto.identityVerificationDocumentBack;
    }
    if (dto.identityVerificationDocumentSelfie !== undefined) {
      data.identityVerificationDocumentSelfie =
        typeof dto.identityVerificationDocumentSelfie === 'string' &&
        dto.identityVerificationDocumentSelfie.trim() === ''
          ? null
          : dto.identityVerificationDocumentSelfie;
    }

    if (dto.jobTitle !== undefined) {
      data.jobTitle = emptyToNull(dto.jobTitle) ?? null;
    }
    if (dto.company !== undefined) {
      data.company = emptyToNull(dto.company) ?? null;
    }
    if (dto.quartier !== undefined) {
      data.quartier = emptyToNull(dto.quartier) ?? null;
    }

    if (dto.city !== undefined) {
      data.city = emptyToNull(dto.city) ?? null;
    }
    if (dto.bio !== undefined) {
      data.bio = emptyToNull(dto.bio) ?? null;
    }
    if (dto.directoryVisible !== undefined) {
      data.directoryVisible = dto.directoryVisible;
    }
    if (dto.showEmailInDirectory !== undefined) {
      data.showEmailInDirectory = dto.showEmailInDirectory;
    }
    if (dto.showPhoneInDirectory !== undefined) {
      data.showPhoneInDirectory = dto.showPhoneInDirectory;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return { user: this.sanitizeUser(updated) };
  }

  private sanitizeUser(user: User) {
    return user;
  }
}

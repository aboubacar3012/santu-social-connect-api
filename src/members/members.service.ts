import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IdentityVerificationStatus,
  Prisma,
  UserStatus,
} from '@/generated/prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(query: ListMembersQueryDto) {
    const where: Prisma.UserWhereInput = {
      directoryVisible: true,
      status: UserStatus.active,
      isBlocked: false,
    };

    if (query.city) {
      where.city = { equals: query.city.trim(), mode: 'insensitive' };
    }
    if (query.q) {
      const term = query.q.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { company: { contains: term, mode: 'insensitive' } },
        { jobTitle: { contains: term, mode: 'insensitive' } },
        { quartier: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return { members: users.map((user) => this.toMemberResponse(user)) };
  }

  async getMemberById(memberId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        directoryVisible: true,
        // status: UserStatus.active,
        isBlocked: false,
      },
    });

    if (!user) {
      throw new NotFoundException('Membre introuvable');
    }

    return { member: this.toMemberResponse(user) };
  }

  private toMemberResponse(user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    jobTitle: string | null;
    company: string | null;
    quartier: string | null;
    city: string | null;
    bio: string | null;
    identityVerified: boolean;
    identityVerificationStatus: IdentityVerificationStatus | null;
    email: string | null;
    phoneE164: string;
    showEmailInDirectory: boolean;
    showPhoneInDirectory: boolean;
  }) {
    const member: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string;
      jobTitle: string;
      company?: string;
      quartier: string;
      city: string;
      bio: string;
      isVerified: boolean;
      email?: string;
      phone?: string;
    } = {
      id: user.id,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      avatar: user.profilePicture ?? '',
      jobTitle: user.jobTitle ?? '',
      quartier: user.quartier ?? '',
      city: user.city ?? '',
      bio: user.bio ?? '',
      isVerified:
        user.identityVerified ||
        user.identityVerificationStatus === IdentityVerificationStatus.approved,
    };

    if (user.company?.trim()) {
      member.company = user.company.trim();
    }
    if (user.showEmailInDirectory && user.email) {
      member.email = user.email;
    }
    if (user.showPhoneInDirectory && user.phoneE164) {
      member.phone = user.phoneE164;
    }

    return member;
  }
}

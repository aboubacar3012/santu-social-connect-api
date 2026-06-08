import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { User } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user?: User | { id: string; phoneE164?: string | null };
};

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil utilisateur connecté (JWT)' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return { user: req.user };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mettre à jour le profil',
    description:
      'Champs partiels. Images : base64 (data URL ou brut) enregistrés tels quels en base.',
  })
  @ApiBody({ type: UpdateUserDto })
  async updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUserDto) {
    const u = req.user;
    const id = u && typeof u === 'object' && 'id' in u ? u.id : undefined;
    if (!id) {
      throw new UnauthorizedException();
    }
    return this.usersService.updateProfile(id, dto);
  }

  @Get('public')
  async getPublic() {
    return { message: 'Public route' };
  }

  @Get('optional')
  async getOptional(@Req() req: AuthenticatedRequest) {
    return { authenticated: !!req.user };
  }
}

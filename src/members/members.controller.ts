import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { MembersService } from './members.service';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les membres de l’annuaire' })
  async list(@Query() query: ListMembersQueryDto) {
    return this.membersService.listMembers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer le profil public d’un membre' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.membersService.getMemberById(id);
  }
}

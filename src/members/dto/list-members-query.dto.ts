import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListMembersQueryDto {
  @ApiPropertyOptional({
    description:
      'Recherche texte (prénom, nom, entreprise, poste, quartier, ville).',
    example: 'Marseille',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ example: 'Marseille' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'Joliette' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quartier?: string;
}

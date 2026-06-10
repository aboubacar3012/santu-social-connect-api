import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * Mise à jour partielle du profil.
 * Images : chaînes base64 (data URL `data:image/...;base64,...` ou base64 nu) — stockées telles quelles en base.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Aboubacar' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Diallo' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Date ISO (YYYY-MM-DD). Vide pour effacer.',
    example: '1990-03-15',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @ApiPropertyOptional({
    description: 'Photo de profil (base64). Chaîne vide pour effacer.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15_000_000)
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'Recto pièce d’identité (base64)' })
  @IsOptional()
  @IsString()
  @MaxLength(15_000_000)
  identityVerificationDocumentFront?: string;

  @ApiPropertyOptional({ description: 'Verso (base64)' })
  @IsOptional()
  @IsString()
  @MaxLength(15_000_000)
  identityVerificationDocumentBack?: string;

  @ApiPropertyOptional({ description: 'Selfie (base64)' })
  @IsOptional()
  @IsString()
  @MaxLength(15_000_000)
  identityVerificationDocumentSelfie?: string;

  @ApiPropertyOptional({ example: 'Fondatrice' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Marseille Labs' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @ApiPropertyOptional({ example: 'Joliette' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  quartier?: string;

  @ApiPropertyOptional({ example: 'Marseille' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({
    example: 'Passionnée par l’innovation locale et les écosystèmes collaboratifs.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Afficher le profil dans l’annuaire public.',
  })
  @IsOptional()
  @IsBoolean()
  directoryVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Afficher l’e-mail dans l’annuaire public.',
  })
  @IsOptional()
  @IsBoolean()
  showEmailInDirectory?: boolean;

  @ApiPropertyOptional({
    description: 'Afficher le téléphone dans l’annuaire public.',
  })
  @IsOptional()
  @IsBoolean()
  showPhoneInDirectory?: boolean;

  @ApiPropertyOptional({
    description: 'Étape d’onboarding (0 = profil à compléter, 1 = terminé).',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  onboardingStep?: number;
}

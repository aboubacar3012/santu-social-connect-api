import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{7,15}$/, {
    message: 'phone doit être au format E.164, ex: +224628000000',
  })
  phoneE164!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,10}$/, { message: 'code invalide' })
  code!: string;
}

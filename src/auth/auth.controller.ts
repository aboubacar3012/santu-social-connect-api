import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('phone/request-otp')
  async requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.phoneE164);
  }

  @Post('phone/verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.phoneE164, body.code);
  }
}

// 1) Demander l’OTP (SMS)
// curl -X POST 'http://localhost:3000/auth/phone/request-otp' \
//   -H 'Content-Type: application/json' \
//   -d '{"phoneE164":"+33758020980"}'

// 2) Vérifier l’OTP (et récupérer le JWT)
// curl -X POST 'http://localhost:3000/auth/phone/verify-otp' \
//   -H 'Content-Type: application/json' \
//   -d '{"phoneE164":"+33758020980", "code":"123456"}'

// (Optionnel) Tester GET /users/me avec le token retourné
// curl 'http://localhost:3000/users/me' \
//   -H "Authorization: Bearer <COLLE_ICI_accessToken>"

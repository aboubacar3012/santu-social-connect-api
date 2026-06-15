import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import twilio = require('twilio');
import { UserStatus } from '../generated/prisma/enums';

const DEV_BYPASS_PHONE = '+33742424242';
const DEV_BYPASS_TARGET_PHONE = '+33758020980';

@Injectable()
export class AuthService {
  private readonly twilioClient: ReturnType<typeof twilio>;
  private readonly verifyServiceSid: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      throw new Error(
        'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_VERIFY_SERVICE_SID sont requis',
      );
    }

    this.twilioClient = twilio(accountSid, authToken);
    this.verifyServiceSid = verifyServiceSid;
  }

  private isDevBypass(phoneE164: string): boolean {
    return phoneE164 === DEV_BYPASS_PHONE;
  }

  async requestOtp(phoneE164: string) {
    if (this.isDevBypass(phoneE164)) {
      return this.loginByPhone(DEV_BYPASS_TARGET_PHONE);
    }

    await this.twilioClient.verify.v2
      .services(this.verifyServiceSid)
      .verifications.create({ to: phoneE164, channel: 'sms' });

    return { ok: true };
  }

  async verifyOtp(phoneE164: string, code: string) {
    if (this.isDevBypass(phoneE164)) {
      return this.loginByPhone(DEV_BYPASS_TARGET_PHONE);
    }

    const check = await this.twilioClient.verify.v2
      .services(this.verifyServiceSid)
      .verificationChecks.create({ to: phoneE164, code });

    if (check.status !== 'approved') {
      throw new BadRequestException('Code OTP invalide');
    }

    return this.loginByPhone(phoneE164);
  }

  private async loginByPhone(phoneE164: string) {
    let user = await this.prisma.user.findUnique({ where: { phoneE164 } });

    if (user?.status === UserStatus.deleted) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: UserStatus.active,
          phoneVerified: true,
          directoryVisible: true,
          showEmailInDirectory: true,
          showPhoneInDirectory: true,
          onboardingStep: 0,
        },
      });
    } else if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneE164,
          email: null,
          emailVerified: false,
          phoneVerified: true,
          firstName: null,
          lastName: null,
          profilePicture: null,
          status: UserStatus.active,
          directoryVisible: true,
          showEmailInDirectory: true,
          showPhoneInDirectory: true,
        },
      });
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      phoneE164: user.phoneE164,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        phoneE164: user.phoneE164,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        jobTitle: user.jobTitle,
        company: user.company,
        city: user.city,
        profilePicture: user.profilePicture,
        onboardingStep: user.onboardingStep,
      },
    };
  }
}

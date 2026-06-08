import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpServer,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../generated/prisma/client';

export type ErrorCodesStatusMapping = {
  [key: string]:
    | number
    | {
        statusCode?: number;
        errorMessage?: string;
      };
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly defaultMapping: Record<string, HttpStatus> = {
    P2000: HttpStatus.BAD_REQUEST,
    P2002: HttpStatus.CONFLICT,
    P2025: HttpStatus.NOT_FOUND,
  };

  private readonly userDefinedMapping?: ErrorCodesStatusMapping;

  constructor(
    applicationRef?: HttpServer,
    errorCodesStatusMapping?: ErrorCodesStatusMapping,
  ) {
    super(applicationRef);
    this.userDefinedMapping = errorCodesStatusMapping;
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    return this.catchClientKnownRequestError(exception, host);
  }

  private catchClientKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const statusCode =
      this.userDefinedStatusCode(exception) ||
      this.defaultStatusCode(exception);

    const message =
      this.userDefinedExceptionMessage(exception) ||
      this.defaultExceptionMessage(exception);

    if (host.getType() === 'http') {
      if (statusCode === undefined) {
        return super.catch(exception, host);
      }

      return super.catch(
        new HttpException({ statusCode, message }, statusCode),
        host,
      );
    }

    if (statusCode === undefined) {
      return exception;
    }

    return new HttpException({ statusCode, message }, statusCode);
  }

  private userDefinedStatusCode(
    exception: Prisma.PrismaClientKnownRequestError,
  ): number | undefined {
    const userDefinedValue = this.userDefinedMapping?.[exception.code];
    return typeof userDefinedValue === 'number'
      ? userDefinedValue
      : userDefinedValue?.statusCode;
  }

  private defaultStatusCode(
    exception: Prisma.PrismaClientKnownRequestError,
  ): number | undefined {
    return this.defaultMapping[exception.code];
  }

  private userDefinedExceptionMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const userDefinedValue = this.userDefinedMapping?.[exception.code];
    return typeof userDefinedValue === 'number'
      ? undefined
      : userDefinedValue?.errorMessage;
  }

  private defaultExceptionMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const shortMessage = exception.message.substring(
      exception.message.indexOf('→'),
    );
    return (
      `[${exception.code}]: ` +
      shortMessage
        .substring(shortMessage.indexOf('\n'))
        .replace(/\n/g, '')
        .trim()
    );
  }
}

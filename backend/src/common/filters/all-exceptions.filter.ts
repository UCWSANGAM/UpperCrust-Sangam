import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

// Sanitizes every error before it leaves the process.
// Internal messages, stack traces, and DB errors never reach the client.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? (exception as HttpException).getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const publicMessage = isHttp
      ? (exception as HttpException).message
      : 'Something went wrong. Please try again.';

    // Full detail goes to logs only
    this.logger.error(isHttp ? publicMessage : (exception as Error)?.stack || exception);

    response.status(status).json({
      statusCode: status,
      message: publicMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

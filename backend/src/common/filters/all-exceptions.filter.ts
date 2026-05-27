import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'An unexpected error occurred. Please try again later.';

    // Detailed structured logging for server logs
    const errorDetails = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      clientIp: request.ip,
      exception:
        exception instanceof Error
          ? {
              name: exception.name,
              message: exception.message,
              stack: exception.stack,
            }
          : exception,
    };

    if (status === 500) {
      // Log unexpected 500 errors as actual errors
      this.logger.error(
        `Unexpected Error on ${request.method} ${request.url} - ${
          exception instanceof Error
            ? exception.message
            : JSON.stringify(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(errorDetails),
      );
    } else {
      // Log expected client/route errors as warnings or verbose
      this.logger.warn(
        `HTTP ${status} on ${request.method} ${request.url} - ${
          typeof message === 'object' ? JSON.stringify(message) : message
        }`,
        JSON.stringify(errorDetails),
      );
    }

    // Format final response to the client
    const responseEnvelope =
      typeof message === 'object'
        ? {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...message,
          }
        : {
            statusCode: status,
            message: message,
            timestamp: new Date().toISOString(),
            path: request.url,
          };

    response.status(status).json(responseEnvelope);
  }
}

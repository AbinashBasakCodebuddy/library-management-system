import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from 'src/generated/prisma/internal/prismaNamespace';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    constructor() {}

    private getExceptionMessage(exception: unknown) {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            return response;
        }

        if (exception instanceof PrismaClientKnownRequestError) {
            const response = exception.message;
            return response;
        }

        return 'Internal server error';
    }

    private getExceptionCode(exception: unknown) {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        if (exception instanceof PrismaClientKnownRequestError) {
            return HttpStatus.BAD_REQUEST;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const httpStatus = this.getExceptionCode(exception);
        const message = this.getExceptionMessage(exception);

        const path = request.url;
        const method = request.method;

        this.logger.error({
            path,
            method,
            status: httpStatus,
            exception,
            timestamp: new Date().toISOString(),
            message,
        });

        const responseBody = {
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path,
            message,
        };

        response.status(httpStatus).json(responseBody);
    }
}

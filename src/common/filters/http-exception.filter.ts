import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    constructor() {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

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

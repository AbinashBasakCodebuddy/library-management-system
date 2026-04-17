import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestLoggerService } from '../loggers/request-logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    constructor(private readonly requestLogger: RequestLoggerService) {}

    use(req: Request, res: Response, next: NextFunction) {
        const start = process.hrtime.bigint();

        res.once('finish', () => {
            const end = process.hrtime.bigint();
            const durationMs = Number(end - start) / 1_000_000;
            this.requestLogger.logRequest(req, res, durationMs);
        });

        next();
    }
}

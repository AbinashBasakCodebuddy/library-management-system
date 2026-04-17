import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const LOG_FILE_PATH = path.resolve(process.cwd(), 'logs', 'requests.log');

@Injectable()
export class RequestLoggerService {
    private readonly logger = new Logger(RequestLoggerService.name);

    constructor() {
        this.ensureLogDirectory();
    }

    private ensureLogDirectory() {
        const dir = path.dirname(LOG_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private writeToFile(entry: string) {
        try {
            fs.appendFileSync(LOG_FILE_PATH, `${entry}\n`, 'utf8');
        } catch (error) {
            this.logger.error(
                'Unable to write request log to file',
                error as Error,
            );
        }
    }

    private formatLog(
        method: string,
        url: string,
        statusCode: number,
        durationMs: number,
        ip: string,
        zone: string,
        timestamp: string,
        userAgent: string,
    ) {
        return JSON.stringify({
            timestamp,
            method,
            url,
            statusCode,
            durationMs,
            ip,
            zone,
            userAgent,
        });
    }

    logRequest(req: Request, res: Response, durationMs: number) {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl || req.url;
        const statusCode = res.statusCode;
        const ip =
            req.ip ||
            req.headers['x-forwarded-for']?.toString() ||
            req.socket.remoteAddress ||
            'unknown';
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const zoneValue = zone ?? 'unknown';
        const userAgent =
            typeof req.headers['user-agent'] === 'string'
                ? req.headers['user-agent']
                : 'unknown';

        const line = this.formatLog(
            method,
            url,
            statusCode,
            durationMs,
            ip,
            zoneValue,
            timestamp,
            userAgent,
        );
        this.logger.log(line);
        this.writeToFile(line);
    }
}

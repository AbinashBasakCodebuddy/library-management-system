import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL ?? process.env.MONGO_URI,
                },
            },
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}

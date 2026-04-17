import {
    Module,
    MiddlewareConsumer,
    NestModule,
    RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthorModule } from './author/author.module';
import { BookModule } from './book/book.module';
import { GenreModule } from './genre/genre.module';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RequestLoggerService } from './common/loggers/request-logger.service';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { redisStore } from 'cache-manager-redis-store';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validationSchema: envValidationSchema,
            validationOptions: {
                abortEarly: false,
                allowUnknown: true,
            },
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('database.mongoUri'),
            }),
        }),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: await redisStore({
                    socket: {
                        host: config.get<string>('cache.host'),
                        port: Number(config.get('cache.port')),
                    },
                    password: config.get<string>('cache.password'),
                    ttl: Number(config.get('cache.ttl')),
                }),
                isGlobal: true,
            }),
        }),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => [
                {
                    ttl: config.get<number>('app.throttlerTtl') as number,
                    limit: config.get<number>('app.throttlerLimit') as number,
                },
            ],
        }),

        AuthModule,
        AuthorModule,
        BookModule,
        GenreModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        RequestLoggerService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}

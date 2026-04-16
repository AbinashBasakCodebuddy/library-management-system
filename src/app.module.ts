import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AuthorModule } from './author/author.module';
import { BookModule } from './book/book.module';
import { GenreModule } from './genre/genre.module';
import Joi from 'joi';

const envSchema = Joi.object({
    PORT: Joi.number().port().default(3000),
    MONGO_URI: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(16).required(),
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
});

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envSchema,
            validationOptions: {
                abortEarly: false,
                allowUnknown: true,
            },
        }),
        MongooseModule.forRoot(process.env.MONGO_URI as string),
        AuthModule,
        AuthorModule,
        BookModule,
        GenreModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}

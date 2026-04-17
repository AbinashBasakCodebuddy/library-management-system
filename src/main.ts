import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // swagger setup
    const config = new DocumentBuilder()
        .setTitle('Library Management System')
        .setDescription('The library management system API description')
        .setVersion('1.0')
        .addTag('library')
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        })
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    app.use(helmet());

    const configService = app.get(ConfigService);

    app.enableCors({
        origin: configService.get<string>('app.corsOrigin')?.split(','),
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    const port = configService.get<number>('app.port') ?? 3000;
    await app.listen(port);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();

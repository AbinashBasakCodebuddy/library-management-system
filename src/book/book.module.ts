import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrivateGuard } from 'src/auth/private.guard';

@Module({
    imports: [PrismaModule],
    controllers: [BookController],
    providers: [BookService, PrivateGuard],
})
export class BookModule {}

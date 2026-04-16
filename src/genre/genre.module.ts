import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { Genre, GenreSchema } from '../schemas/genre.schema';
import { Book, BookSchema } from '../schemas/book.schema';
import { PrivateGuard } from '../auth/private.guard';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Genre.name, schema: GenreSchema },
            { name: Book.name, schema: BookSchema },
        ]),
    ],
    controllers: [GenreController],
    providers: [GenreService, PrivateGuard],
})
export class GenreModule {}

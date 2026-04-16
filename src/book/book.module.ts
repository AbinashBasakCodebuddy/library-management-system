import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from 'src/schemas/book.schema';
import { Genre, GenreSchema } from 'src/schemas/genre.schema';
import { PrivateGuard } from 'src/auth/private.guard';
import { Author, AuthorSchema } from 'src/schemas/author.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Author.name, schema: AuthorSchema },
            { name: Book.name, schema: BookSchema },
            { name: Genre.name, schema: GenreSchema },
        ]),
    ],
    controllers: [BookController],
    providers: [BookService, PrivateGuard],
})
export class BookModule {}

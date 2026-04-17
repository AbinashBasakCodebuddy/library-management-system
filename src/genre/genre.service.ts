import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument, Types } from 'mongoose';
import { Genre } from '../schemas/genre.schema';
import { Book, type BookModel } from '../schemas/book.schema';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenreService {
    constructor(
        @InjectModel(Genre.name)
        private readonly genreModel: Model<HydratedDocument<Genre>>,
        @InjectModel(Book.name)
        private readonly bookModel: BookModel,
    ) {}

    async create(createGenreDto: CreateGenreDto, authorId: string) {
        const existingGenre = await this.genreModel
            .findOne({
                name: createGenreDto.name,
                creator: new Types.ObjectId(authorId),
                deletedAt: null,
            })
            .exec();

        if (existingGenre) {
            throw new BadRequestException(
                'Genre with this name already exists',
            );
        }

        return this.genreModel.create({
            ...createGenreDto,
            creator: new Types.ObjectId(authorId),
        });
    }

    findAll(authorId: string) {
        return this.genreModel
            .find({ creator: new Types.ObjectId(authorId), deletedAt: null })
            .exec();
    }

    async findOne(id: string, authorId: string) {
        const genre = await this.genreModel
            .findOne({
                _id: new Types.ObjectId(id),
                creator: new Types.ObjectId(authorId),
                deletedAt: null,
            })
            .exec();

        if (!genre) {
            throw new NotFoundException('Genre not found');
        }

        return genre;
    }

    async update(id: string, updateGenreDto: UpdateGenreDto, authorId: string) {
        const genre = await this.genreModel
            .findOneAndUpdate(
                {
                    _id: new Types.ObjectId(id),
                    creator: new Types.ObjectId(authorId),
                    deletedAt: null,
                },
                updateGenreDto,
                {
                    new: true,
                },
            )
            .exec();

        if (!genre) {
            throw new NotFoundException('Genre not found or access denied');
        }

        return genre;
    }

    async remove(id: string, authorId: string) {
        const bookCount = await this.bookModel.findOne({
            genres: new Types.ObjectId(id),
            deletedAt: null,
        });

        if (bookCount) {
            throw new BadRequestException(
                'Cannot delete genre while books are associated with it',
            );
        }

        const genre = await this.genreModel
            .findOneAndUpdate(
                {
                    _id: new Types.ObjectId(id),
                    creator: new Types.ObjectId(authorId),
                    deletedAt: null,
                },
                { deletedAt: new Date() },
                {
                    new: true,
                },
            )
            .exec();

        if (!genre) {
            throw new NotFoundException('Genre not found or access denied');
        }

        return { deleted: true };
    }
}

import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { type Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument, Types } from 'mongoose';
import { Genre } from '../schemas/genre.schema';
import { Book, type BookModel } from '../schemas/book.schema';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class GenreService {
    private readonly cacheTTL = 300;

    constructor(
        @InjectModel(Genre.name)
        private readonly genreModel: Model<HydratedDocument<Genre>>,
        @InjectModel(Book.name)
        private readonly bookModel: BookModel,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
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

        const genre = await this.genreModel.create({
            ...createGenreDto,
            creator: new Types.ObjectId(authorId),
        });

        await this.cacheManager.del(`genre:list:${authorId}`);
        return genre;
    }

    async findAll(authorId: string) {
        const cacheKey = `genre:list:${authorId}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await this.genreModel
            .find({ creator: new Types.ObjectId(authorId), deletedAt: null })
            .exec();

        await this.cacheManager.set(cacheKey, result, this.cacheTTL);

        return result;
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

        await this.cacheManager.del(`genre:list:${authorId}`);
        await this.cacheManager.del(`book:list:${authorId}`);

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

        await this.cacheManager.del(`genre:list:${authorId}`);
        return { deleted: true };
    }
}

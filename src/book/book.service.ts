import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, type BookModel } from 'src/schemas/book.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Genre, type GenreModel } from 'src/schemas/genre.schema';
import { PipelineStage, Types } from 'mongoose';
import { GetBookDto } from './dto/get-book.dto';
import { Author, type AuthorModel } from 'src/schemas/author.schema';

@Injectable()
export class BookService {
    constructor(
        @InjectModel(Book.name) private readonly bookModel: BookModel,
        @InjectModel(Author.name) private readonly authorModel: AuthorModel,
        @InjectModel(Genre.name)
        private readonly genreModel: GenreModel,
    ) {}

    private async checkGenresExistAndBelongToUser(
        genreIds: string[],
        userId: string,
    ): Promise<void> {
        for (const genreId of genreIds) {
            const genre = await this.genreModel
                .findOne({ _id: genreId, creator: userId })
                .exec();

            if (!genre) {
                throw new BadRequestException(
                    `Genre with ID ${genreId} not found or not owned by you`,
                );
            }
        }
    }

    async create(createBookDto: CreateBookDto, userId: string) {
        // check for duplicate title for the same author
        const existingBook = await this.bookModel
            .findOne({ title: createBookDto.title, author: userId })
            .exec();

        if (existingBook) {
            throw new BadRequestException(
                'You already have a book with this title',
            );
        }

        // check if all genres exist and belong to the user
        await this.checkGenresExistAndBelongToUser(
            createBookDto.genres,
            userId,
        );

        return this.bookModel.create({
            title: createBookDto.title,
            author: new Types.ObjectId(userId),
            genres: createBookDto.genres,
        });
    }

    async getPublicBooks(payload: GetBookDto) {
        const matchStage: PipelineStage.Match = {
            $match: {},
        };

        if (payload.bookName) {
            matchStage.$match.title = {
                $regex: payload.bookName,
                $options: 'i',
            };
        }
        if (payload.authorName) {
            const authorList = await this.authorModel.find({
                name: { $regex: payload.authorName, $options: 'i' },
            });
            const authorIds = authorList.map((author) => author._id);
            matchStage.$match.author = { $in: authorIds };
        }
        if (payload.genres) {
            const genresArray = payload.genres
                .split(',')
                .map((genre) => new Types.ObjectId(genre.trim()));
            matchStage.$match.genres = { $in: genresArray };
        }

        return this.bookModel.aggregate([
            matchStage,
            {
                $lookup: {
                    from: 'authors',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                _id: 0,
                            },
                        },
                    ],
                },
            },
            {
                $set: {
                    author: {
                        $arrayElemAt: ['$author.name', 0],
                    },
                },
            },
            {
                $lookup: {
                    from: 'genres',
                    localField: 'genres',
                    foreignField: '_id',
                    as: 'genres',
                    pipeline: [
                        {
                            $project: { name: 1 },
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    author: 1,
                    genres: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]);
    }

    findAll(userId: string) {
        return this.bookModel.aggregate([
            {
                $match: {
                    author: new Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: 'authors',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                _id: 0,
                            },
                        },
                    ],
                },
            },
            {
                $set: {
                    author: {
                        $arrayElemAt: ['$author.name', 0],
                    },
                },
            },
            {
                $lookup: {
                    from: 'genres',
                    localField: 'genres',
                    foreignField: '_id',
                    as: 'genres',
                    pipeline: [
                        {
                            $project: { name: 1 },
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    author: 1,
                    genres: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]);
    }

    async findOne(id: string, userId: string) {
        const book = await this.bookModel.aggregate<Book>([
            {
                $match: {
                    _id: new Types.ObjectId(id),
                    author: new Types.ObjectId(userId),
                },
            },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'authors',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                _id: 0,
                            },
                        },
                    ],
                },
            },
            {
                $set: {
                    author: {
                        $arrayElemAt: ['$author.name', 0],
                    },
                },
            },
            {
                $lookup: {
                    from: 'genres',
                    localField: 'genres',
                    foreignField: '_id',
                    as: 'genres',
                    pipeline: [
                        {
                            $project: { name: 1 },
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    author: 1,
                    genres: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]);

        if (book.length === 0) {
            throw new BadRequestException('Book not found or access denied');
        }

        return book[0];
    }

    async update(id: string, updateBookDto: UpdateBookDto, authorId: string) {
        const book = await this.bookModel.findOne({
            _id: new Types.ObjectId(id),
            author: new Types.ObjectId(authorId),
        });

        if (!book) {
            throw new BadRequestException('Book not found or access denied');
        }

        if (updateBookDto.genres) {
            // check if all genres exist and belong to the user
            await this.checkGenresExistAndBelongToUser(
                updateBookDto.genres,
                authorId,
            );

            book.genres = updateBookDto.genres.map(
                (genreId) => new Types.ObjectId(genreId),
            );
        }

        if (updateBookDto.title) {
            // check for duplicate title for the same author
            const existingBook = await this.bookModel
                .findOne({
                    title: updateBookDto.title,
                    author: authorId,
                    _id: { $ne: id },
                })
                .exec();

            if (existingBook) {
                throw new BadRequestException(
                    'You already have a book with this title',
                );
            }

            book.title = updateBookDto.title;
        }

        await book.save();

        return book;
    }

    async remove(id: string, authorId: string) {
        const book = await this.bookModel.findOneAndDelete({
            _id: id,
            author: authorId,
        });

        if (!book) {
            throw new BadRequestException('Book not found or access denied');
        }

        return { message: 'Book deleted successfully' };
    }
}

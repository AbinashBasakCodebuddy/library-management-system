import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { GetBookDto } from './dto/get-book.dto';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class BookService {
    private readonly cacheTTL = 300;

    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}

    private buildPublicListKey(payload: GetBookDto) {
        const hash = createHash('sha256')
            .update(JSON.stringify(payload))
            .digest('hex');
        return `book:public:list:${hash}`;
    }

    private async invalidateUserBookCache(userId: string, bookId?: string) {
        await this.cacheManager.del(`book:list:${userId}`);
        if (bookId) {
            await this.cacheManager.del(`book:detail:${userId}:${bookId}`);
        }
    }

    private async checkGenresExistAndBelongToUser(
        genreIds: string[],
        userId: string,
    ): Promise<void> {
        const genres = await this.prisma.genre.findMany({
            where: {
                id: { in: genreIds },
                creatorId: userId,
                deletedAt: null,
            },
        });

        if (genres.length !== genreIds.length) {
            throw new NotFoundException(
                'One or more genres were not found or not owned by you',
            );
        }
    }

    async create(createBookDto: CreateBookDto, userId: string) {
        const existingBook = await this.prisma.book.findFirst({
            where: {
                title: createBookDto.title,
                authorId: userId,
                deletedAt: null,
            },
        });

        if (existingBook) {
            throw new BadRequestException(
                'You already have a book with this title',
            );
        }

        await this.checkGenresExistAndBelongToUser(
            createBookDto.genres,
            userId,
        );

        const book = await this.prisma.book.create({
            data: {
                title: createBookDto.title,
                authorId: userId,
                deletedAt: null,

                bookGenres: {
                    create: createBookDto.genres.map((genreId) => ({
                        genre: {
                            connect: { id: genreId, deletedAt: null },
                        },
                    })),
                },
            },
            include: {
                bookGenres: {
                    include: {
                        genre: true,
                    },
                },
            },
        });

        await this.invalidateUserBookCache(userId);
        return book;
    }

    async getPublicBooks(payload: GetBookDto) {
        const cacheKey = this.buildPublicListKey(payload);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const where: Prisma.BookWhereInput = {
            deletedAt: null,
        };

        // 🔍 Book title filter
        if (payload.bookName) {
            where.title = {
                contains: payload.bookName,
                mode: 'insensitive',
            };
        }

        // 🔍 Author filter
        if (payload.authorName) {
            const authors = await this.prisma.author.findMany({
                where: {
                    name: {
                        contains: payload.authorName,
                        mode: 'insensitive',
                    },
                    deletedAt: null,
                },
                select: { id: true },
            });
            if (authors.length === 0) {
                return [];
            }
            where.authorId = { in: authors.map((author) => author.id) };
        }

        // 🔍 Genre filter
        if (payload.genres?.length) {
            const genreIds = payload.genres.split(',').map((g) => g.trim());

            where.bookGenres = {
                some: {
                    genreId: {
                        in: genreIds,
                    },
                },
            };
        }

        const books = await this.prisma.book.findMany({
            where,
            include: {
                author: { select: { name: true } },
                bookGenres: {
                    include: {
                        genre: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        const result = books.map((book) => ({
            ...book,
            author: book.author?.name,
            genres: book.bookGenres.map((genre) => genre.genre.name),
        }));
        await this.cacheManager.set(cacheKey, result);
        return result;
    }

    async findAll(userId: string) {
        const cacheKey = `book:list:${userId}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const books = await this.prisma.book.findMany({
            where: {
                authorId: userId,
                deletedAt: null,
            },
            include: {
                author: { select: { name: true } },
                bookGenres: {
                    include: {
                        genre: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        const result = books.map((book) => ({
            ...book,
            author: book.author?.name,
            genres: book.bookGenres.map((genre) => genre.genre.name),
        }));
        await this.cacheManager.set(cacheKey, result);
        return result;
    }

    async findOne(id: string, userId: string) {
        const cacheKey = `book:detail:${userId}:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const book = await this.prisma.book.findFirst({
            where: {
                id,
                authorId: userId,
                deletedAt: null,
            },
            include: {
                author: { select: { name: true } },
                bookGenres: {
                    include: {
                        genre: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!book) {
            throw new NotFoundException('Book not found or access denied');
        }

        const result = {
            ...book,
            author: book.author?.name,
            genres: book.bookGenres.map((genre) => genre.genre.name),
        };
        await this.cacheManager.set(cacheKey, result);
        return result;
    }

    async update(id: string, updateBookDto: UpdateBookDto, authorId: string) {
        const existingBook = await this.prisma.book.findFirst({
            where: {
                id,
                authorId,
                deletedAt: null,
            },
        });

        if (!existingBook) {
            throw new NotFoundException('Book not found or access denied');
        }

        // ✅ Validate genres
        if (updateBookDto.genres) {
            await this.checkGenresExistAndBelongToUser(
                updateBookDto.genres,
                authorId,
            );
        }

        // ✅ Title uniqueness check
        if (updateBookDto.title) {
            const duplicateBook = await this.prisma.book.findFirst({
                where: {
                    title: updateBookDto.title,
                    authorId,
                    deletedAt: null,
                    id: { not: id },
                },
            });

            if (duplicateBook) {
                throw new BadRequestException(
                    'You already have a book with this title',
                );
            }
        }

        const updatedBook = await this.prisma.$transaction(async (tx) => {
            // 1️⃣ Update basic fields
            if (updateBookDto.title) {
                await tx.book.update({
                    where: { id },
                    data: {
                        title: updateBookDto.title,
                    },
                });
            }

            // 2️⃣ Update genres
            if (updateBookDto.genres) {
                // delete old relations
                await tx.bookGenre.deleteMany({
                    where: { bookId: id },
                });

                // create new relations
                await tx.bookGenre.createMany({
                    data: updateBookDto.genres.map((genreId) => ({
                        bookId: id,
                        genreId,
                    })),
                });
            }

            // 3️⃣ Fetch full data
            return tx.book.findUnique({
                where: { id },
                include: {
                    author: { select: { name: true } },
                    bookGenres: {
                        include: {
                            genre: { select: { name: true } },
                        },
                    },
                },
            });
        });

        await this.invalidateUserBookCache(authorId, id);

        return {
            ...updatedBook,
            author: updatedBook?.author?.name,
            genres: updatedBook?.bookGenres.map((bg) => bg.genre.name),
        };
    }

    async remove(id: string, authorId: string) {
        const deleted = await this.prisma.book.update({
            where: {
                id,
                authorId,
                deletedAt: null,
            },
            data: { deletedAt: new Date() },
        });

        if (!deleted) {
            throw new NotFoundException('Book not found or access denied');
        }

        await this.invalidateUserBookCache(authorId, id);
        return { message: 'Book deleted successfully' };
    }
}

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

@Injectable()
export class BookService {
    private readonly cacheTTL = 300;

    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}

    private async getCached<T>(
        key: string,
        factory: () => Promise<T>,
        ttl = this.cacheTTL,
    ): Promise<T> {
        const cached = await this.cacheManager.get<T>(key);
        if (cached) {
            return cached;
        }

        const result = await factory();
        await this.cacheManager.set(key, result, ttl);
        return result;
    }

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
                genres: createBookDto.genres,
            },
        });

        await this.invalidateUserBookCache(userId);
        return book;
    }

    async getPublicBooks(payload: GetBookDto) {
        const cacheKey = this.buildPublicListKey(payload);
        return this.getCached(cacheKey, async () => {
            const where: any = {
                deletedAt: null,
            };

            if (payload.bookName) {
                where.title = {
                    contains: payload.bookName,
                    mode: 'insensitive',
                };
            }

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

            if (payload.genres) {
                where.genres = {
                    hasEvery: payload.genres
                        .split(',')
                        .map((genre) => genre.trim()),
                };
            }

            const books = await this.prisma.book.findMany({
                where,
                include: {
                    author: { select: { name: true } },
                },
            });

            const genreIds = Array.from(
                new Set(books.flatMap((book) => book.genres ?? [])),
            );
            const genres = await this.prisma.genre.findMany({
                where: { id: { in: genreIds } },
                select: { id: true, name: true },
            });
            const genreMap = new Map(
                genres.map((genre) => [genre.id, genre.name]),
            );

            return books.map((book) => ({
                ...book,
                author: book.author?.name,
                genres: book.genres.map(
                    (genreId) => genreMap.get(genreId) ?? genreId,
                ),
            }));
        });
    }

    findAll(userId: string) {
        const cacheKey = `book:list:${userId}`;
        return this.getCached(cacheKey, async () => {
            const books = await this.prisma.book.findMany({
                where: {
                    authorId: userId,
                    deletedAt: null,
                },
                include: {
                    author: { select: { name: true } },
                },
            });

            const genreIds = Array.from(
                new Set(books.flatMap((book) => book.genres ?? [])),
            );
            const genres = await this.prisma.genre.findMany({
                where: { id: { in: genreIds } },
                select: { id: true, name: true },
            });
            const genreMap = new Map(
                genres.map((genre) => [genre.id, genre.name]),
            );

            return books.map((book) => ({
                ...book,
                author: book.author?.name,
                genres: book.genres.map(
                    (genreId) => genreMap.get(genreId) ?? genreId,
                ),
            }));
        });
    }

    async findOne(id: string, userId: string) {
        const cacheKey = `book:detail:${userId}:${id}`;
        return this.getCached(cacheKey, async () => {
            const book = await this.prisma.book.findFirst({
                where: {
                    id,
                    authorId: userId,
                    deletedAt: null,
                },
                include: {
                    author: { select: { name: true } },
                },
            });

            if (!book) {
                throw new NotFoundException('Book not found or access denied');
            }

            const genres = await this.prisma.genre.findMany({
                where: { id: { in: book.genres } },
                select: { id: true, name: true },
            });
            const genreMap = new Map(
                genres.map((genre) => [genre.id, genre.name]),
            );

            return {
                ...book,
                author: book.author?.name,
                genres: book.genres.map(
                    (genreId) => genreMap.get(genreId) ?? genreId,
                ),
            };
        });
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

        if (updateBookDto.genres) {
            await this.checkGenresExistAndBelongToUser(
                updateBookDto.genres,
                authorId,
            );
        }

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

        const updateData: any = {};
        if (updateBookDto.title !== undefined) {
            updateData.title = updateBookDto.title;
        }
        if (updateBookDto.genres !== undefined) {
            updateData.genres = updateBookDto.genres;
        }

        const updatedBook = await this.prisma.book.update({
            where: { id },
            data: updateData,
            include: {
                author: { select: { name: true } },
            },
        });

        await this.invalidateUserBookCache(authorId, id);

        const genres = await this.prisma.genre.findMany({
            where: { id: { in: updatedBook.genres } },
            select: { id: true, name: true },
        });
        const genreMap = new Map(genres.map((genre) => [genre.id, genre.name]));

        return {
            ...updatedBook,
            author: updatedBook.author?.name,
            genres: updatedBook.genres.map(
                (genreId) => genreMap.get(genreId) ?? genreId,
            ),
        };
    }

    async remove(id: string, authorId: string) {
        const deleted = await this.prisma.book.updateMany({
            where: {
                id,
                authorId,
                deletedAt: null,
            },
            data: { deletedAt: new Date() },
        });

        if (deleted.count === 0) {
            throw new NotFoundException('Book not found or access denied');
        }

        await this.invalidateUserBookCache(authorId, id);
        return { message: 'Book deleted successfully' };
    }
}

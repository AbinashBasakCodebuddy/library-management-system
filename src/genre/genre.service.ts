import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { type Cache } from 'cache-manager';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GenreService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createGenreDto: CreateGenreDto, authorId: string) {
        const existingGenre = await this.prisma.genre.findFirst({
            where: {
                name: createGenreDto.name,
                creatorId: authorId,
                deletedAt: null,
            },
        });

        if (existingGenre) {
            throw new BadRequestException(
                'Genre with this name already exists',
            );
        }

        const genre = await this.prisma.genre.create({
            data: {
                ...createGenreDto,
                creatorId: authorId,
                deletedAt: null,
            },
        });

        return genre;
    }

    async findAll(authorId: string) {
        const result = await this.prisma.genre.findMany({
            where: {
                creatorId: authorId,
                deletedAt: null,
            },
        });

        return result;
    }

    async findOne(id: string, authorId: string) {
        const genre = await this.prisma.genre.findFirst({
            where: {
                id: id,
                creatorId: authorId,
                deletedAt: null,
            },
        });

        if (!genre) {
            throw new NotFoundException('Genre not found');
        }

        return genre;
    }

    async update(id: string, updateGenreDto: UpdateGenreDto, authorId: string) {
        const genre = await this.prisma.genre.update({
            where: {
                id,
                creatorId: authorId,
                deletedAt: null,
            },
            data: updateGenreDto,
        });

        if (!genre) {
            throw new NotFoundException('Genre not found or access denied');
        }

        return genre;
    }

    async remove(id: string, authorId: string) {
        const bookExists = await this.prisma.bookGenre.findFirst({
            where: {
                genreId: id,
                book: {
                    deletedAt: null,
                },
            },
        });

        if (bookExists) {
            throw new BadRequestException(
                'Cannot delete genre while books are associated with it',
            );
        }

        const result = await this.prisma.genre.updateMany({
            where: {
                id,
                creatorId: authorId,
                deletedAt: null,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        if (result.count === 0) {
            throw new NotFoundException('Genre not found or access denied');
        }

        return { deleted: true };
    }
}

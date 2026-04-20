import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthorDto } from './dto/create-author.dto';
import { LoginAuthorDto } from './dto/login-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import bcryptjs from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthorService {
    private readonly cacheTTL = 300;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {}

    async signup(createAuthorDto: CreateAuthorDto) {
        const existingAuthor = await this.prisma.author.findFirst({
            where: {
                email: createAuthorDto.email,
                deletedAt: null,
            },
        });

        if (existingAuthor) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcryptjs.hash(
            createAuthorDto.password,
            10,
        );
        const author = await this.prisma.author.create({
            data: {
                name: createAuthorDto.name,
                email: createAuthorDto.email,
                address: createAuthorDto.address,
                password: hashedPassword,
                bio: createAuthorDto.bio,
            },
        });

        const { password, ...result } = author;
        return result;
    }

    async login(loginAuthorDto: LoginAuthorDto) {
        const author = await this.prisma.author.findFirst({
            where: {
                email: loginAuthorDto.email,
                deletedAt: null,
            },
        });

        if (!author) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatches = await bcryptjs.compare(
            loginAuthorDto.password,
            author.password,
        );

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: author.id, email: author.email };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    findAll() {
        return this.prisma.author.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findOne(id: string) {
        const cacheKey = `author:profile:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const user = await this.prisma.author.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Author not found');
        }

        await this.cacheManager.set(cacheKey, user, this.cacheTTL);
        return user;
    }

    async update(id: string, updateAuthorDto: UpdateAuthorDto) {
        if (updateAuthorDto.password) {
            updateAuthorDto.password = await bcryptjs.hash(
                updateAuthorDto.password,
                10,
            );
        }

        const author = await this.prisma.author.updateOne({
            where: {
                id,
                deletedAt: null,
            },
            data: {
                name: updateAuthorDto.name,
                email: updateAuthorDto.email,
                address: updateAuthorDto.address,
                bio: updateAuthorDto.bio,
                password: updateAuthorDto.password,
            },
        });

        if (author.count === 0) {
            throw new NotFoundException('Author not found or already deleted');
        }

        await this.cacheManager.del(`author:profile:${id}`);

        const updated = await this.prisma.author.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return updated;
    }

    async remove(id: string) {
        const author = await this.prisma.author.updateMany({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });

        if (author.count === 0) {
            throw new UnauthorizedException(
                'Author not found or already deleted',
            );
        }

        await this.cacheManager.del(`author:profile:${id}`);

        return {
            message: 'Author deleted successfully',
        };
    }
}

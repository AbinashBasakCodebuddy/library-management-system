import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthorDto } from './dto/create-author.dto';
import { LoginAuthorDto } from './dto/login-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import bcryptjs from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthorService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
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
                deletedAt: null,
            },
        });

        return {
            ...author,
            password: undefined,
        };
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
        return user;
    }

    async update(id: string, updateAuthorDto: UpdateAuthorDto) {
        if (updateAuthorDto.password) {
            updateAuthorDto.password = await bcryptjs.hash(
                updateAuthorDto.password,
                10,
            );
        }

        const author = await this.prisma.author.update({
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

        if (!author) {
            throw new NotFoundException('Author not found or already deleted');
        }

        return {
            id: author.id,
            name: author.name,
            email: author.email,
            address: author.address,
            bio: author.bio,
            createdAt: author.createdAt,
            updatedAt: author.updatedAt,
        };
    }

    async remove(id: string) {
        const author = await this.prisma.author.update({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });

        if (!author) {
            throw new UnauthorizedException(
                'Author not found or already deleted',
            );
        }

        return {
            message: 'Author deleted successfully',
        };
    }
}

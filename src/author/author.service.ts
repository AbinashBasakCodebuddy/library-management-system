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
import { Author, type AuthorModel } from '../schemas/author.schema';
import { CreateAuthorDto } from './dto/create-author.dto';
import { LoginAuthorDto } from './dto/login-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import bcryptjs from 'bcryptjs';
import { Types } from 'mongoose';

@Injectable()
export class AuthorService {
    private readonly cacheTTL = 300;

    constructor(
        @InjectModel(Author.name)
        private readonly authorModel: AuthorModel,
        private readonly jwtService: JwtService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {}

    async signup(createAuthorDto: CreateAuthorDto) {
        const existingAuthor = await this.authorModel
            .findOne({ email: createAuthorDto.email, deletedAt: null })
            .exec();

        if (existingAuthor) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcryptjs.hash(
            createAuthorDto.password,
            10,
        );
        const author = await this.authorModel.create({
            ...createAuthorDto,
            password: hashedPassword,
        });

        const result = author.toObject();
        return { ...result, password: undefined };
    }

    async login(loginAuthorDto: LoginAuthorDto) {
        const author = await this.authorModel
            .findOne({ email: loginAuthorDto.email, deletedAt: null })
            .exec();

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

        const payload = { sub: author._id.toString(), email: author.email };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    findAll() {
        return this.authorModel
            .find({ deletedAt: null }, { password: 0, deletedAt: 0 })
            .exec();
    }

    async findOne(id: string) {
        const cacheKey = `author:profile:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        const user = await this.authorModel
            .findOne(
                { _id: id, deletedAt: null },
                { password: 0, deletedAt: 0 },
            )
            .exec();

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

        const author = await this.authorModel
            .findOneAndUpdate(
                {
                    _id: new Types.ObjectId(id),
                    deletedAt: null,
                },
                updateAuthorDto,
                {
                    new: true,
                },
            )
            .exec();

        if (!author) {
            throw new NotFoundException('Author not found or already deleted');
        }

        await this.cacheManager.del(`author:profile:${id}`);

        const result = author.toObject();
        return { ...result, password: undefined };
    }

    async remove(id: string) {
        const author = await this.authorModel
            .findOneAndUpdate(
                { _id: id, deletedAt: null },
                { deletedAt: new Date() },
                { new: true },
            )
            .exec();

        if (!author) {
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

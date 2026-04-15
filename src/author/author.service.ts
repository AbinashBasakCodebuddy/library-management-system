import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Author, type AuthorModel } from '../schemas/author.schema';
import { CreateAuthorDto } from './dto/create-author.dto';
import { LoginAuthorDto } from './dto/login-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthorService {
    constructor(
        @InjectModel(Author.name)
        private readonly authorModel: AuthorModel,
        private readonly jwtService: JwtService,
    ) {}

    async signup(createAuthorDto: CreateAuthorDto) {
        const existingAuthor = await this.authorModel
            .findOne({ email: createAuthorDto.email })
            .exec();

        if (existingAuthor) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(createAuthorDto.password, 10);
        const author = await this.authorModel.create({
            ...createAuthorDto,
            password: hashedPassword,
        });

        const result = author.toObject();
        return { ...result, password: undefined };
    }

    async login(loginAuthorDto: LoginAuthorDto) {
        const author = await this.authorModel
            .findOne({ email: loginAuthorDto.email })
            .exec();

        if (!author) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatches = await bcrypt.compare(
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
        return this.authorModel.find({}, { password: 0 }).exec();
    }

    findOne(id: string) {
        return this.authorModel.findById(id, { password: 0 }).exec();
    }

    update(id: string, updateAuthorDto: UpdateAuthorDto) {
        return this.authorModel
            .findByIdAndUpdate(id, updateAuthorDto, { new: true })
            .exec();
    }

    remove(id: string) {
        return this.authorModel.findByIdAndDelete(id).exec();
    }
}

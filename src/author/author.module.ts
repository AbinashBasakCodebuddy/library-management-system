import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorService } from './author.service';
import { AuthorController } from './author.controller';
import { Author, AuthorSchema } from '../schemas/author.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Author.name, schema: AuthorSchema },
        ]),
        AuthModule,
    ],
    controllers: [AuthorController],
    providers: [AuthorService],
})
export class AuthorModule {}

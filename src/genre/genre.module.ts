import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { PrivateGuard } from '../auth/private.guard';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GenreController],
    providers: [GenreService, PrivateGuard],
})
export class GenreModule {}

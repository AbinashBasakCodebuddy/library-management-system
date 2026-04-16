import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrivateGuard } from '../auth/private.guard';
import { JoiValidationPipe } from '../common/pipes/joi-validation.pipe';
import { createGenreSchema, updateGenreSchema } from './genre.validation';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('genre')
export class GenreController {
    constructor(private readonly genreService: GenreService) {}

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Post()
    create(
        @Body(new JoiValidationPipe(createGenreSchema))
        createGenreDto: CreateGenreDto,
        @CurrentUser() user: { userId: string },
    ) {
        return this.genreService.create(createGenreDto, user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Get()
    findAll(@CurrentUser() user: { userId: string }) {
        return this.genreService.findAll(user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
        return this.genreService.findOne(id, user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body(new JoiValidationPipe(updateGenreSchema))
        updateGenreDto: UpdateGenreDto,
        @CurrentUser() user: { userId: string },
    ) {
        return this.genreService.update(id, updateGenreDto, user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
        return this.genreService.remove(id, user.userId);
    }
}

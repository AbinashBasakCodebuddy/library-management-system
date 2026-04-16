import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PrivateGuard } from 'src/auth/private.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import { createBookSchema, updateBookSchema } from './book.validation';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { GetBookDto } from './dto/get-book.dto';
import { Public } from 'src/auth/public.decorator';

@Controller('book')
export class BookController {
    constructor(private readonly bookService: BookService) {}

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Post()
    create(
        @Body(new JoiValidationPipe(createBookSchema))
        createBookDto: CreateBookDto,
        @CurrentUser() user: { userId: string },
    ) {
        return this.bookService.create(createBookDto, user.userId);
    }

    @Public()
    @Get('public/list')
    getPublicBooks(@Query() query: GetBookDto) {
        console.log(query);

        return this.bookService.getPublicBooks(query);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Get()
    findAll(@CurrentUser() user: { userId: string }) {
        return this.bookService.findAll(user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
        return this.bookService.findOne(id, user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body(new JoiValidationPipe(updateBookSchema))
        updateBookDto: UpdateBookDto,
        @CurrentUser() user: { userId: string },
    ) {
        return this.bookService.update(id, updateBookDto, user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
        return this.bookService.remove(id, user.userId);
    }
}

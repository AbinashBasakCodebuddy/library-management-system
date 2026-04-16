import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    UseGuards,
    UsePipes,
} from '@nestjs/common';
import { AuthorService } from './author.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { LoginAuthorDto } from './dto/login-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { JoiValidationPipe } from '../common/pipes/joi-validation.pipe';
import { loginSchema, signupSchema } from './author.validation';
import { Public } from '../auth/public.decorator';
import { PrivateGuard } from '../auth/private.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('author')
export class AuthorController {
    constructor(private readonly authorService: AuthorService) {}

    @Public()
    @Post('signup')
    @UsePipes(new JoiValidationPipe(signupSchema))
    signup(@Body() createAuthorDto: CreateAuthorDto) {
        return this.authorService.signup(createAuthorDto);
    }

    @Public()
    @Post('login')
    @UsePipes(new JoiValidationPipe(loginSchema))
    login(@Body() loginAuthorDto: LoginAuthorDto) {
        return this.authorService.login(loginAuthorDto);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Get('me')
    findOne(@CurrentUser() user: { userId: string }) {
        return this.authorService.findOne(user.userId);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Patch('me')
    update(
        @CurrentUser() user: { userId: string },
        @Body() updateAuthorDto: UpdateAuthorDto,
    ) {
        return this.authorService.update(user.userId, updateAuthorDto);
    }

    @ApiBearerAuth()
    @UseGuards(PrivateGuard)
    @Delete('me')
    remove(@CurrentUser() user: { userId: string }) {
        return this.authorService.remove(user.userId);
    }
}

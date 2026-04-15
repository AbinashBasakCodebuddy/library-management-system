import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UnauthorizedException,
    UsePipes,
} from '@nestjs/common';
import { AuthorService } from './author.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { LoginAuthorDto } from './dto/login-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { JoiValidationPipe } from '../common/pipes/joi-validation.pipe';
import { loginSchema, signupSchema } from './author.validation';
import { Public } from '../auth/public.decorator';

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

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
        if (req.user.userId !== id) {
            throw new UnauthorizedException('Access denied');
        }
        return this.authorService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateAuthorDto: UpdateAuthorDto,
        @Req() req: { user: { userId: string } },
    ) {
        if (req.user.userId !== id) {
            throw new UnauthorizedException('Access denied');
        }
        return this.authorService.update(id, updateAuthorDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
        if (req.user.userId !== id) {
            throw new UnauthorizedException('Access denied');
        }
        return this.authorService.remove(id);
    }
}

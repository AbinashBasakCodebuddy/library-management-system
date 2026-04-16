import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetBookDto {
    @ApiPropertyOptional({
        example: 'Book Title',
        description: 'Title of the book',
    })
    bookName!: string;

    @ApiPropertyOptional({
        example: 'Author Name',
        description: 'Name of the author',
    })
    authorName!: string;

    @ApiPropertyOptional({
        type: String,
        example: '',
        description: 'List of genres for the book join with comma',
    })
    genres!: string;
}

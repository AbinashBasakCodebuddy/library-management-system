import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
    @ApiProperty({
        example: 'Book Title',
        description: 'Title of the book',
    })
    title!: string;

    @ApiProperty({
        type: [String],
        example: [],
        description: 'List of genres for the book',
    })
    genres!: string[];
}

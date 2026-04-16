import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGenreDto {
    @ApiProperty({
        example: 'Genre Name',
        description: 'Full name of the genre',
    })
    name!: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the genre is public',
    })
    isPublic?: boolean;
}

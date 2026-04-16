import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthorDto {
    @ApiProperty({
        example: 'User Name',
        description: 'Full name of the author',
    })
    name!: string;

    @ApiProperty({
        example: 'user1@example.com',
        description: 'Author email address',
    })
    email!: string;

    @ApiPropertyOptional({
        example: 'Kolkata, India',
        description: 'Author address',
    })
    address?: string;

    @ApiProperty({
        example: 'strongPassword123',
        description: 'Author password',
    })
    password!: string;

    @ApiPropertyOptional({
        example: 'Tech writer and blogger',
        description: 'Short bio of the author',
    })
    bio?: string;
}

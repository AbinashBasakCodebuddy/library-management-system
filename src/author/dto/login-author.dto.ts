import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthorDto {
    @ApiProperty({
        example: 'user1@example.com',
        description: 'Author email address',
    })
    email!: string;

    @ApiProperty({
        example: 'strongPassword123',
        description: 'Author password',
    })
    password!: string;
}

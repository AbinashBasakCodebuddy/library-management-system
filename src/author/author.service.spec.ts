import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuthorService } from './author.service';
import { Author } from '../schemas/author.schema';

const mockAuthorModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({ exec: jest.fn() }),
    findById: jest.fn().mockReturnValue({ exec: jest.fn() }),
    findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
    findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
};

describe('AuthorService', () => {
    let service: AuthorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthorService,
                {
                    provide: getModelToken(Author.name),
                    useValue: mockAuthorModel,
                },
            ],
        }).compile();

        service = module.get<AuthorService>(AuthorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

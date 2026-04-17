import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        throw new Error(
            'This is a test error to demonstrate the global exception filter',
        );
    }
}

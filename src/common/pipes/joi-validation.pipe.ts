import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { type Schema } from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private readonly schema: Schema) {}

    transform(value: any): any {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { error, value: validated } = this.schema.validate(value, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details
                .map((detail) => detail.message)
                .join(', ');
            throw new BadRequestException(`Validation failed: ${messages}`);
        }

        return validated;
    }
}

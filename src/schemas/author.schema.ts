import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema({ timestamps: true })
export class Author {
    @Prop({ required: true })
    declare name: string;

    @Prop({ required: true })
    declare email: string;

    @Prop({ required: true })
    declare password: string;

    @Prop()
    declare address: string;

    @Prop()
    bio?: string;

    @Prop({ default: null })
    deletedAt?: Date;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
export type AuthorModel = Model<HydratedDocument<Author>>;
AuthorSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
        },
    },
);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema({ timestamps: true })
export class Author {
    @Prop({ required: true })
    declare name: string;

    @Prop({ required: true })
    declare email: string;

    @Prop()
    declare address: string;

    @Prop({ required: true })
    declare password: string;

    @Prop()
    bio?: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
export type AuthorModel = Model<HydratedDocument<Author>>;

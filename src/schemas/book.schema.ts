import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Book {
    @Prop({ required: true })
    declare title: string;

    @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
    declare author: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Genre' }] })
    declare genres: Types.ObjectId[];
}

export const BookSchema = SchemaFactory.createForClass(Book);
export type BookModel = Model<HydratedDocument<Book>>;
BookSchema.index({ title: 1, author: 1 }, { unique: true });

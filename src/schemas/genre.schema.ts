import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Genre {
    @Prop({ required: true })
    declare name: string;

    @Prop({ default: false })
    declare isPublic: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
    declare creator: Types.ObjectId;

    @Prop({ default: null })
    deletedAt?: Date;
}

export const GenreSchema = SchemaFactory.createForClass(Genre);
export type GenreModel = Model<HydratedDocument<Genre>>;
GenreSchema.index(
    { creator: 1, name: 1 },
    {
        unique: true,
        partialFilterExpression: {
            deletedAt: null,
        },
    },
);

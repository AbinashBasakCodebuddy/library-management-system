import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Genre {
    @Prop({ required: true })
    declare name: string;

    @Prop({ default: false })
    declare isPublic: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
    declare creator: Types.ObjectId;
}

export const GenreSchema = SchemaFactory.createForClass(Genre);
GenreSchema.index({ creator: 1, name: 1 }, { unique: true });

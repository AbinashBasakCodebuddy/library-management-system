import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Genre {
    @Prop({ required: true, unique: true })
    declare name: string;
}

export const GenreSchema = SchemaFactory.createForClass(Genre);

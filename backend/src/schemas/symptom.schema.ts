import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Symptom extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string; // 'physical', 'emotional', 'other'

  @Prop()
  icon: string;
}

export const SymptomSchema = SchemaFactory.createForClass(Symptom);

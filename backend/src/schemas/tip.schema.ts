import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Tip extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  phase: string; // 'menstrual', 'follicular', 'ovulatory', 'luteal'

  @Prop()
  icon: string;

  @Prop()
  hashTag: string;
}

export const TipSchema = SchemaFactory.createForClass(Tip);


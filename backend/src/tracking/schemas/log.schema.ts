import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Log extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Symptom' }] })
  symptoms: Types.ObjectId[];

  @Prop({ min: 0, max: 10 })
  flowIntensity: number;

  @Prop()
  mood: string;

  @Prop()
  sexualHealth: string;

  @Prop()
  notes: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
LogSchema.index({ userId: 1, date: -1 });
LogSchema.index({ userId: 1, flowIntensity: 1, date: -1 });

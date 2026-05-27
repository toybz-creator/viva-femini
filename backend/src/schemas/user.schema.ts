import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: 28 })
  avgCycleLength: number;

  @Prop({ default: 5 })
  avgPeriodLength: number;

  @Prop()
  lastPeriodDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

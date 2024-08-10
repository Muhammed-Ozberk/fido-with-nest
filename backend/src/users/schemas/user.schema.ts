import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id: ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Object }) // Ek alanlar ekleyin
  registrationOptions: any; // İhtiyaca göre türü ayarlayın

  @Prop({ type: Object })
  authenticationOptions: any; // İhtiyaca göre türü ayarlayın
}

export const UserSchema = SchemaFactory.createForClass(User);

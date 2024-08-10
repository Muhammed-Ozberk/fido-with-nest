import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import {
  Base64URLString,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/typescript-types';

@Schema()
export class Passkey extends Document {
  _id: ObjectId;

  @Prop({ required: true, type: String })
  credentialID: string; // Credential ID

  @Prop({ required: true })
  webauthnUserID: Base64URLString; // WebAuthn işlemleri için uygun formatta ID

  @Prop({ required: true, type: Buffer })
  publicKey: Buffer; // Uint8Array as Buffer

  @Prop({ required: true, type: String })
  user: string; // User ID (Foreign Key)

  @Prop({ required: true, type: Number })
  counter: number;

  @Prop({ required: true, type: String })
  deviceType: string; // CredentialDeviceType

  @Prop({ required: true, type: Boolean })
  backedUp: boolean;

  @Prop({ type: [String] })
  transports: AuthenticatorTransportFuture[]; // AuthenticatorTransportFuture[]
}

export const PasskeySchema = SchemaFactory.createForClass(Passkey);

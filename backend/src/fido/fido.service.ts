import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/typescript-types';
import { Passkey } from './schemas/passkey.schema';
import { UsersService } from '../users/users.service';
import { UserDocument } from 'src/users/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class FidoService {
  private rpName = 'SimpleWebAuthn Example';
  private rpID = 'localhost';
  private origin = `http://${this.rpID}:3000`;

  constructor(
    @InjectModel(Passkey.name) private passkeyModel: Model<Passkey>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private convertObjectIdToUint8Array(objectId: ObjectId): Uint8Array {
    // ObjectId'yi hexadecimal string'e dönüştür
    const hexString = objectId.toString(); // Veya toHexString() yerine toString()

    // Hexadecimal string'i byte dizisine dönüştür
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }

    return bytes;
  }

  async generateRegistrationOptions(
    userId: string,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const userPasskeys = await this.passkeyModel.find({ user: user._id });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: this.convertObjectIdToUint8Array(user._id),
      userName: user.username,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map((passkey) => ({
        id: passkey.webauthnUserID,
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    (user as UserDocument).registrationOptions = options;
    const savedUser = await (user as UserDocument).save();

    if (!savedUser) {
      throw new Error('Error saving user registration options');
    }

    return options;
  }

  async verifyRegistrationResponse(
    userId: string,
    response: any,
  ): Promise<boolean> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    console.log('user:', user);

    const currentOptions = user.registrationOptions;
    if (!currentOptions) {
      throw new Error('No registration options found for user');
    }

    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        const {
          credentialID,
          credentialPublicKey,
          counter,
          credentialDeviceType,
          credentialBackedUp,
        } = registrationInfo;

        const newPasskey = new this.passkeyModel({
          user: user._id,
          webauthnUserID: currentOptions.user.id,
          credentialID: credentialID,
          publicKey: Buffer.from(credentialPublicKey),
          counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: response.response.transports,
        });

        await newPasskey.save();

        return true;
      }
    } catch (error) {
      console.error('Error verifying registration response:', error);
      return false;
    }

    return false;
  }

  async generateAuthenticationOptions(
    username: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new Error(`User with id ${username} not found`);
    }

    const userPasskeys = await this.passkeyModel.find({ user: user._id });

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: userPasskeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports,
      })),
      userVerification: 'preferred',
    });

    (user as UserDocument).authenticationOptions = options;
    await (user as UserDocument).save();

    return options;
  }

  async verifyAuthenticationResponse(
    userId: string,
    response: any,
  ): Promise<boolean | { success: boolean; access_token?: string }> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const currentOptions = user.authenticationOptions;
    if (!currentOptions) {
      throw new Error('No authentication options found for user');
    }

    const userPasskeys = await this.passkeyModel.find({ user: user._id });

    const foundPasskey = userPasskeys.find(
      (passkey) => passkey.id === response.id,
    );

    if (!foundPasskey) {
      throw new Error('Passkey not found for user');
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialPublicKey: foundPasskey.publicKey,
          counter: foundPasskey.counter,
          credentialID: foundPasskey.id,
          transports: foundPasskey.transports,
        },
      });

      const { verified, authenticationInfo } = verification;

      if (verified && authenticationInfo) {
        foundPasskey.set('counter', authenticationInfo.newCounter);
        await foundPasskey.save();
        return {
          success: true,
          access_token: this.jwtService.sign({ sub: user._id }),
        };
      }
    } catch (error) {
      console.error('Error verifying authentication response:', error);
      return false;
    }

    return false;
  }
}

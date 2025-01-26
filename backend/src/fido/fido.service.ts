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
import {
  errorResponse,
  successResponse,
} from 'src/common/utils/response.function';
import { ResponseDto } from 'src/common/dtos/response.dto';

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
  ): Promise<ResponseDto<PublicKeyCredentialCreationOptionsJSON>> {
    try {
      const user = await this.usersService.findUserById(userId);
      if (!user) {
        return errorResponse('User not found', 'User not found', 404);
      }

      const userPasskeys = await this.passkeyModel.find({ user: user._id });

      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: this.convertObjectIdToUint8Array(user._id),
        userName: user.username,
        attestationType: 'none',
        excludeCredentials: userPasskeys.map((passkey) => ({
          id: passkey.credentialID,
          transports: passkey.transports,
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      (user as UserDocument).registrationOptions = options;
      const savedUser = await (user as UserDocument).save();

      if (!savedUser) {
        return errorResponse('User not saved', 'User not saved', 500);
      }

      return successResponse(options, 'Registration options generated');
    } catch (error) {
      console.error('Error generating registration options:', error);
      return errorResponse(
        'Error generating registration options',
        'Error generating registration options',
        500,
      );
    }
  }

  async verifyRegistrationResponse(
    userId: string,
    response: any,
  ): Promise<ResponseDto<boolean>> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      return errorResponse('User not found', 'User not found', 404);
    }

    const currentOptions = user.registrationOptions;
    if (!currentOptions) {
      return errorResponse(
        'No registration options found for user',
        'No registration options found for user',
        500,
      );
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

        return successResponse(true, 'Registration successful');
      }
    } catch (error) {
      console.error('Error verifying registration response:', error);
      return errorResponse(
        'Error verifying registration response',
        'Error verifying registration',
        500,
      );
    }

    return errorResponse('Registration failed', 'Registration failed', 500);
  }

  async generateAuthenticationOptions(
    username: string,
  ): Promise<ResponseDto<PublicKeyCredentialRequestOptionsJSON>> {
    try {
      const user = await this.usersService.findOne(username);
      if (!user) {
        return errorResponse('User not found', 'User not found', 404);
      }

      const userPasskeys = await this.passkeyModel.find({ user: user._id });

      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        allowCredentials: userPasskeys.map((passkey) => ({
          id: passkey.credentialID,
          transports: passkey.transports,
        })),
        userVerification: 'preferred',
      });

      (user as UserDocument).authenticationOptions = options;
      await (user as UserDocument).save();

      return successResponse(options, 'Authentication options generated');
    } catch (error) {
      console.error('Error generating authentication options:', error);
      return errorResponse(
        'Error generating authentication options',
        'Error generating authentication options',
        500,
      );
    }
  }

  async verifyAuthenticationResponse(
    username: string,
    response: any,
  ): Promise<ResponseDto<{ success: boolean; token?: string } | boolean>> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      return errorResponse('User not found', 'User not found', 404);
    }

    const currentOptions = user.authenticationOptions;
    if (!currentOptions) {
      return errorResponse(
        'No authentication options found for user',
        'No authentication options found for user',
        500,
      );
    }

    const userPasskeys = await this.passkeyModel.find({ user: user._id });

    const foundPasskey = userPasskeys.find(
      (passkey) => passkey.credentialID === response.id,
    );

    if (!foundPasskey) {
      return errorResponse('Passkey not found', 'Passkey not found', 404);
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
          credentialID: foundPasskey.credentialID,
          transports: foundPasskey.transports,
        },
      });

      const { verified, authenticationInfo } = verification;

      if (verified && authenticationInfo) {
        foundPasskey.set('counter', authenticationInfo.newCounter);
        await foundPasskey.save();
        const payload = { username: user.username, sub: user._id };
        return successResponse(
          { success: true, token: this.jwtService.sign(payload) },
          'Authentication successful',
        );
      }
    } catch (error) {
      console.error('Error verifying authentication response:', error);
      return errorResponse(
        'Error verifying authentication response',
        'Error verifying authentication response',
        500,
      );
    }

    return errorResponse('Authentication failed', 'Authentication failed', 500);
  }
}

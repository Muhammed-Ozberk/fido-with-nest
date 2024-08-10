// src/fido/fido.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FidoService } from './fido.service';
import { FidoController } from './fido.controller';
import { Passkey, PasskeySchema } from './schemas/passkey.schema';
import { UsersModule } from '../users/users.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Passkey.name, schema: PasskeySchema }]),
    UsersModule, // UserService'i import ediyoruz
  ],
  providers: [FidoService, UsersModule, JwtService], // UserService'i provider olarak ekliyoruz
  controllers: [FidoController],
})
export class FidoModule {}

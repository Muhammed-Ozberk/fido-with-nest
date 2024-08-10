import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FidoModule } from './fido/fido.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest-auth'), // MongoDB bağlantı URI
    UsersModule,
    AuthModule,
    FidoModule,
  ],
})
export class AppModule {}

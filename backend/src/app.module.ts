import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FidoModule } from './fido/fido.module';
import * as dotenv from 'dotenv';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './logger/logger.middleware';

dotenv.config(); // .env dosyasını yükle

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI), // MongoDB bağlantı URI
    UsersModule,
    AuthModule,
    FidoModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // Tüm rotalar için middleware'i uygular
  }
}

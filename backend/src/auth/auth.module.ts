import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: 'secretKey', // Güvenlik anahtarınızı buraya yazın veya bir ortam değişkeninde saklayın.
      signOptions: { expiresIn: '1h' }, // Token süresi 1 saat.
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

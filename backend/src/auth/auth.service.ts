import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/schemas/user.schema';
import { ResponseDto } from 'src/common/dtos/response.dto';
import {
  errorResponse,
  successResponse,
} from 'src/common/utils/response.function';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    return this.usersService.validateUser(username, password);
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<ResponseDto<{ token: string }>> {
    const user = await this.validateUser(
      loginUserDto.username,
      loginUserDto.password,
    );

    if (!user) {
      return errorResponse('Invalid credentials', 'UnauthorizedException', 401);
    }

    const payload = { username: user.username, sub: user._id };
    const token = this.jwtService.sign(payload);

    return successResponse({ token }, 'Login successful');
  }

  async register(createUserDto: CreateUserDto): Promise<ResponseDto<User>> {
    const user = await this.usersService.create(createUserDto);
    return successResponse(user, 'Registration successful');
  }
}

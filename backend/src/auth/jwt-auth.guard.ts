import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { errorResponse } from 'src/common/utils/response.function';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // Token eksikse açıklayıcı bir hata mesajı fırlat
      throw new UnauthorizedException(
        errorResponse('Token eksik', 'No token provided', 401),
      );
    }

    try {
      const payload = this.jwtService.verify(token, { secret: 'secretKey' });
      request['user'] = payload;
      return true;
    } catch {
      // Token geçersizse açıklayıcı bir hata mesajı fırlat
      throw new UnauthorizedException(
        errorResponse('Geçersiz token', 'Invalid token', 401),
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

export class AuthUser {
  id!: string;
  role?: string;
  email?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.NEXTAUTH_SECRET || 'secret';
      const payload = verify(token, secret) as any;
      const userId = payload.sub || payload.id;

      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = {
        id: userId,
        role: payload.role,
        email: payload.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

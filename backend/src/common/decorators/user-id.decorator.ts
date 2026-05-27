import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { hashTokenToId } from '../utils/hash';

export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  
  // Extract token from standard headers
  const authHeader =
    request.headers['authorization'] ||
    request.headers['authtoken'] ||
    request.headers['x-auth-token'];

  if (!authHeader) {
    throw new UnauthorizedException('Authorization credentials not found in request headers');
  }

  const userId = hashTokenToId(authHeader);
  if (!userId) {
    throw new UnauthorizedException('Invalid authorization credentials');
  }

  return userId;
});

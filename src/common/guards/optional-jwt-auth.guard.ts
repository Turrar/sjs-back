import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Allows unauthenticated access; attaches `user` when Bearer token is valid */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    const req = context
      .switchToHttp()
      .getRequest<{ headers?: { authorization?: string } }>();
    const auth = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }

  override handleRequest<TUser>(
    err: Error | undefined,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser | undefined {
    const req = context
      .switchToHttp()
      .getRequest<{ headers?: { authorization?: string } }>();
    const auth = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return undefined;
    }
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}

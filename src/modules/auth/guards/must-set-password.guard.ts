import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MustSetPasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { mustSetPassword?: boolean } }>();

    const user = request.user;

    if (user?.mustSetPassword) {
      throw new ForbiddenException(
        'Vous devez configurer votre mot de passe avant de continuer.',
      );
    }

    return true;
  }
}

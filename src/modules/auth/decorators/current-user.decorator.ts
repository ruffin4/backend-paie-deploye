import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserResponse } from '../interfaces/user.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof IUserResponse | undefined,
    ctx: ExecutionContext,
  ): IUserResponse | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUserResponse;
    return data ? user?.[data] : user;
  },
);

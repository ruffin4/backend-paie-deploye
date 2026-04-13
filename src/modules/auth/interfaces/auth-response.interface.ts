import { IUserResponse } from './user.interface';

export interface IAuthResponse {
  access_token: string;
  user: IUserResponse;
}

export type ILoginResponse = IAuthResponse;

export type IRegisterResponse = IAuthResponse;

export type IProfileResponse = IUserResponse;

export interface ILogoutResponse {
  message: string;
}

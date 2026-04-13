export interface IJwtPayload {
  sub: number; // user id
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

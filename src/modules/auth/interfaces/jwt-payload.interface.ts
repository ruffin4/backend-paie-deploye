export interface IJwtPayload {
  sub: string; // user uuid
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

export interface IUser {
  uuid: string;
  email: string;
  passwordHash: string;
  nom?: string;
  prenom?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'ADMIN' | 'GESTIONNAIRE';

export interface IUserResponse {
  uuid: string;
  email: string;
  nom?: string;
  prenom?: string;
  role: UserRole;
}

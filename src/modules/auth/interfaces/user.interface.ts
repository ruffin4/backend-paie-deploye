export interface IUser {
  id: number;
  email: string;
  passwordHash: string;
  nom?: string;
  prenom?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'ADMIN' | 'USER' | 'GESTIONNAIRE';

export interface IUserResponse {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  role: UserRole;
}
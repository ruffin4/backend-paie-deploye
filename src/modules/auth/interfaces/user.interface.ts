export interface IUser {
  uuid: string;
  email: string;
  username?: string;
  passwordHash: string;
  nom?: string;
  prenom?: string;
  role: UserRole;
  mustSetPassword: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'ADMIN' | 'GESTIONNAIRE';

export interface IUserResponse {
  uuid: string;
  email: string;
  username?: string;
  nom?: string;
  prenom?: string;
  role: UserRole;
  mustSetPassword: boolean;
  invitationSent: boolean;
}

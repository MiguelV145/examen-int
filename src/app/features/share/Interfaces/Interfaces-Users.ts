// src/app/core/interfaces/user-profile.interface.ts
export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'Programador';
  displayName?: string;
}
/**
 * DTOs para autenticación con backend Spring Boot JWT
 */

export interface AuthLoginRequest {
  identifier: string;
  password: string;
}

export interface AuthRegisterRequest {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  roles: string[]; // ["ADMIN"] | ["USER"] | ["ADMIN", "USER"]
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

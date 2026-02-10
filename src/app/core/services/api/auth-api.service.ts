import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthLoginRequest, AuthRegisterRequest, AuthResponse } from '../../models/auth.models';

/**
 * Servicio API para autenticación con backend Spring Boot
 * Solo se encarga de hacer HTTP calls, NO gestiona estado
 * 
 * Nota: El backend espera {email, password} pero recibimos {identifier}
 * Transformamos identifier → email para compatibilidad con backend
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  /**
   * POST /api/auth/login
   * 
   * Recibe: {identifier, password}
   * Envía al backend: {email, password} (identifier se convierte a email)
   * 
   * @param dto Credenciales con identifier (email o username) y password
   * @returns Observable<AuthResponse> con token, userId, username, email, roles
   */
  login(dto: AuthLoginRequest): Observable<AuthResponse> {
    // Transformar identifier → email para que el backend lo entienda
    // El backend espera {email, password}, no {identifier, password}
    const backendPayload = {
      email: dto.identifier,
      password: dto.password
    };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, backendPayload);
  }

  /**
   * POST /api/auth/register
   * @param dto Nuevas credenciales (username, email, password, passwordConfirm)
   * @returns Observable<AuthResponse> con token, userId, username, email, roles
   */
  register(dto: AuthRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, dto);
  }
}


import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthLoginRequest, AuthRegisterRequest, AuthResponse } from '../../models/auth.models';

/**
 * Servicio API para autenticación con backend Spring Boot
 * Solo se encarga de hacer HTTP calls, NO gestiona estado
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/api/auth`;

  /**
   * POST /api/auth/login
   * @param dto Credenciales (emailOrUsername, password)
   * @returns Observable<AuthResponse> con token, userId, username, email, roles
   */
  login(dto: AuthLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, dto);
  }

  /**
   * POST /api/auth/register
   * @param dto Nuevas credenciales (username, email, password)
   * @returns Observable<AuthResponse> con token, userId, username, email, roles
   */
  register(dto: AuthRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, dto);
  }
}

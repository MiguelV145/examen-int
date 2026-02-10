import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthLoginRequest, AuthResponse } from '../../models/auth.models';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  login(body: AuthLoginRequest): Observable<AuthResponse> {
    const url = `${this.baseUrl}/api/auth/login`; // <- un solo /api
    return this.http.post<AuthResponse>(url, body);
  }

  /**
   * Register: Intenta parsear respuesta como AuthResponse
   * Si el backend devuelve JSON: retorna AuthResponse
   * Si el backend devuelve texto plano: retorna { message: "..." }
   */
  register(body: any): Observable<AuthResponse | { message: string }> {
    const url = `${this.baseUrl}/api/auth/register`;

    // Hacer una sola petición y decidir por el contenido
    return this.http.post(url, body, { responseType: 'text' }).pipe(
      map((raw) => {
        try {
          const parsed = JSON.parse(raw) as AuthResponse;
          if (parsed?.token && parsed?.userId) {
            return parsed;
          }
        } catch {
          // Respuesta no es JSON, continuar como texto
        }
        return { message: raw } as { message: string };
      })
    );
  }
}


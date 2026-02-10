import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthLoginRequest, AuthResponse } from '../../models/auth.models';
import { Observable, map, catchError, of } from 'rxjs';

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
    
    // Intentar primero como JSON (AuthResponse)
    return this.http.post<AuthResponse>(url, body).pipe(
      catchError((error) => {
        // Si falla el parseo JSON, intentar como texto
        return this.http.post(url, body, { responseType: 'text' }).pipe(
          map(message => ({ message } as any))
        );
      })
    );
  }
}


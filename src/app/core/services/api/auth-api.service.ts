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
   * Register: El backend devuelve texto plano, no JSON
   * Ejemplo: "Usuario registrado correctamente"
   * Transformamos a { message: "..." } para uniformidad
   */
  register(body: any): Observable<{ message: string }> {
    const url = `${this.baseUrl}/api/auth/register`;
    return this.http.post(url, body, { responseType: 'text' })
      .pipe(
        map(message => ({ message }))
      );
  }
}

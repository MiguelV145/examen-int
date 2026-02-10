import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthLoginRequest, AuthResponse } from '../../models/auth.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  login(body: AuthLoginRequest): Observable<AuthResponse> {
    const url = `${this.baseUrl}/api/auth/login`; // <- un solo /api
    return this.http.post<AuthResponse>(url, body);
  }

  register(body: any): Observable<any> {
    const url = `${this.baseUrl}/api/auth/register`;
    return this.http.post(url, body);
  }
}

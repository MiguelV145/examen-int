import { Injectable, inject, Signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';
import { AuthStoreService } from './auth-store.service';
import { AuthResponse, User } from '../../models/auth.models';

/**
 * AuthService - WRAPPER unificado para autenticación
 * 
 * Este servicio envuelve AuthApiService + AuthStoreService para dar
 * compatibilidad hacia atrás con código legado que espera:
 * - login(email, password)
 * - currentUser signal
 * - isAuthenticated() método
 * - logout()
 * - hasRole()
 * 
 * Internamente usa AuthStoreService para gestionar estado y AuthApiService
 * para HTTP, sin acceso directo a access_token ni uso de email en backend.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authApi = inject(AuthApiService);
  private authStore = inject(AuthStoreService);
  private router = inject(Router);

  /**
   * Signal que expone el usuario actual 
   * (wrapper del authStore.user para compatibilidad)
   */
  currentUser: Signal<User | null> = computed(() => this.authStore.user());

  constructor() {}

  /**
   * Login - WRAPPER que acepta email o identifier
   * Convierte {email, password} a {identifier, password} para el backend
   * Guarda el token y usuario en AuthStoreService
   * 
   * @param emailOrIdentifier Email o username/identifier
   * @param password Contraseña
   * @returns Observable<AuthResponse>
   */
  login(emailOrIdentifier: string, password: string): Observable<AuthResponse> {
    const identifier = (emailOrIdentifier || '').trim();
    
    if (!identifier || !password) {
      return throwError(() => new Error('Email/Usuario y contraseña son requeridos'));
    }

    // Llamar a AuthApiService con identifier (NO email)
    return this.authApi.login({ identifier, password }).pipe(
      tap((response) => {
        // AuthStoreService maneja la persistencia automáticamente
        this.authStore.setAuth(response);
        console.log('✅ Login exitoso mediante AuthService wrapper');
      }),
      catchError((error) => {
        console.error('❌ Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si el usuario está autenticado
   * Delega al AuthStoreService
   */
  isAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }

  /**
   * Obtiene el token del store
   * (NO accede directamente a access_token)
   */
  getToken(): string | null {
    return this.authStore.token();
  }

  /**
   * Logout - Limpia sesión y redirige a login
   * Delega al AuthStoreService que limpia todas las claves
   */
  logout(): void {
    this.authStore.logout();
    // AuthStoreService ya redirige a /login
  }

  /**
   * Verifica si tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.authStore.hasRole(role);
  }

  /**
   * Verifica si es ADMIN
   */
  isAdmin(): boolean {
    return this.authStore.isAdmin();
  }
}

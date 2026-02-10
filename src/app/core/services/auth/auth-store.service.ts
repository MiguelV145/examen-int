import { Injectable, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { User, AuthResponse } from '../../models/auth.models';

/**
 * Store para autenticación con signals
 * Gestiona token, usuario, roles e isAuthenticated
 * Persiste datos en localStorage
 */
@Injectable({
  providedIn: 'root',
})
export class AuthStoreService {
  private router = inject(Router);

  // Signals
  token = signal<string | null>(null);
  user = signal<User | null>(null);
  roles = signal<string[]>([]);
  isAuthenticated = signal(false);

  constructor() {
    // Cargar datos persistidos al iniciar
    this.loadFromStorage();

    // Effect para sincronizar isAuthenticated cuando token cambia
    effect(() => {
      const hasToken = this.token() !== null;
      this.isAuthenticated.set(hasToken);
    });

    // Effect para sincronizar roles cuando user cambia
    effect(() => {
      const currentUser = this.user();
      this.roles.set(currentUser?.roles || []);
    });
  }

  /**
   * Establece token y usuario (después de login/register exitoso)
   * @param response AuthResponse del backend
   */
  setAuth(response: AuthResponse): void {
    this.token.set(response.token);
    this.user.set({
      id: response.userId,
      username: response.username,
      email: response.email,
      roles: response.roles,
    });
    this.persistToStorage();
  }

  /**
   * Logout: limpia señales y localStorage
   */
  logout(): void {
    this.token.set(null);
    this.user.set(null);
    this.roles.set([]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  /**
   * Verifica si usuario es ADMIN
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Persiste token y usuario en localStorage
   */
  private persistToStorage(): void {
    const currentToken = this.token();
    const currentUser = this.user();

    if (currentToken) {
      localStorage.setItem('auth_token', currentToken);
    }
    if (currentUser) {
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }
  }

  /**
   * Carga token y usuario desde localStorage
   */
  private loadFromStorage(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (token) {
      this.token.set(token);
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.user.set(user);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }
}

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
    const normalizedRoles = this.normalizeRoles(response.roles || []);
    this.user.set({
      id: response.userId,
      username: response.username,
      email: response.email,
      roles: normalizedRoles,
      photoURL: response.photoURL,
      displayName: response.displayName,
      uid: response.userId.toString(), // Compatibilidad con código legado
    });
    this.persistToStorage();
  }

  /**
   * Logout: limpia señales y localStorage (ambas keys)
   */
  logout(): void {
    this.token.set(null);
    this.user.set(null);
    this.roles.set([]);
    
    // Borrar todas las variaciones de token y user
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('current_user');
    localStorage.removeItem('refresh_token'); // Limpieza adicional si existe
    
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const roles = this.roles();
    if (roles.includes(role)) return true;
    if (role.startsWith('ROLE_')) {
      const legacy = role.replace(/^ROLE_/, '');
      return roles.includes(legacy);
    }
    return roles.includes(`ROLE_${role}`);
  }

  /**
   * Verifica si usuario es ADMIN
   */
  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  /**
   * Persiste token y usuario en localStorage con dos keys cada uno (compatibilidad)
   * Token: 'auth_token' (nuevo) y 'access_token' (viejo)
   * User: 'auth_user' (nuevo) y 'current_user' (viejo)
   */
  private persistToStorage(): void {
    const currentToken = this.token();
    const currentUser = this.user();

    if (currentToken) {
      localStorage.setItem('auth_token', currentToken);
      localStorage.setItem('access_token', currentToken); // Backwards compatibility
    }
    if (currentUser) {
      const userJson = JSON.stringify(currentUser);
      localStorage.setItem('auth_user', userJson);
      localStorage.setItem('current_user', userJson); // Backwards compatibility
    }
  }

  /**
   * Carga token y usuario desde localStorage (intenta ambas keys para compatibilidad)
   */
  private loadFromStorage(): void {
    // Intentar cargar token desde 'auth_token' o 'access_token'
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    
    // Intentar cargar user desde 'auth_user' o 'current_user'
    const userStr = localStorage.getItem('auth_user') || localStorage.getItem('current_user');

    if (token) {
      this.token.set(token);
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        if (user?.roles?.length) {
          user.roles = this.normalizeRoles(user.roles);
        }
        this.user.set(user);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }

  private normalizeRoles(roles: string[]): string[] {
    return roles
      .filter((role) => !!role)
      .map((role) => (role.startsWith('ROLE_') ? role : `ROLE_${role}`));
  }
}

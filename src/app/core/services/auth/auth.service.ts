import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';

// DTOs del backend Spring Boot
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface BackendUserDto {
  id: number;
  email: string;
  roles: string[]; // ADMIN | PROGRAMADOR | USER
  profileId?: number;
  portfolioId?: number;
  displayName?: string;
  photoURL?: string; // Para compatibilidad con Firebase
  uid?: string; // Para compatibilidad: será id.toString()
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: BackendUserDto;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signal para el usuario actual
  currentUser = signal<BackendUserDto | null>(null);

  // Observable para compatibilidad con componentes que esperan user$ (Firebase legacy)
  private userSubject = new BehaviorSubject<{uid?: string; email?: string} | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    // Cargar usuario desde localStorage al iniciar
    this.loadUserFromStorage();

    // Emitir cambios de currentUser en user$ para compatibilidad
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.userSubject.next({
          uid: user.uid || user.id.toString(),
          email: user.email
        });
      } else {
        this.userSubject.next(null);
      }
    });
  }

  /**
   * Login en el backend Spring Boot
   * Guarda accessToken, refreshToken y usuario en localStorage
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const dto: LoginDTO = { email, password };
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, dto)
      .pipe(
        tap((response) => {
          this._saveAuthData(response);
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Registro en el backend
   * Retorna un string con el mensaje
   */
  register(email: string, password: string, confirmPassword: string): Observable<string> {
    const dto: RegisterDTO = { email, password, confirmPassword };
    return this.http
      .post(`${environment.apiUrl}/auth/register`, dto, { responseType: 'text' })
      .pipe(
        catchError((error) => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Verifica si el usuario está autenticado
   * Checa que el token exista y no haya expirado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Decodificar JWT sin librerías: sección payload (índice 1)
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      const exp = decoded.exp;

      if (!exp) {
        return false;
      }

      // exp está en segundos, Date.now() en milisegundos
      const now = Date.now() / 1000;
      return exp > now;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.roles.includes(role) : false;
  }

  /**
   * Logout: limpia localStorage y actualiza signal
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el access token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Private: Guarda tokens y usuario en localStorage y actualiza signal
   */
  private _saveAuthData(response: LoginResponse): void {
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    
    // Agregar uid como string para compatibilidad
    const userWithCompat: BackendUserDto = {
      ...response.user,
      uid: response.user.id.toString()
    };
    
    localStorage.setItem('auth_user', JSON.stringify(userWithCompat));
    this.currentUser.set(userWithCompat);
  }

  /**
   * Private: Carga usuario desde localStorage al iniciar la app
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('auth_user');

    if (userStr && this.isAuthenticated()) {
      try {
        const user: BackendUserDto = JSON.parse(userStr);
        this.currentUser.set(user);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }
}

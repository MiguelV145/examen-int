import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';

// DTOs
export interface LoginDTO {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  roles: string[]; // ADMIN | PROGRAMADOR | USER
}

export interface CurrentUser {
  userId: number;
  username: string;
  email: string;
  roles: string[];
  photoURL?: string;      // Foto de perfil (opcional)
  displayName?: string;   // Nombre mostrable (opcional)
  uid?: string;           // Firebase UID (opcional, para compatibilidad)
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals
  currentUser = signal<CurrentUser | null>(null);
  isAuthenticated = signal<boolean>(false);

  // Observable para compatibilidad con componentes que esperan user$ (Firebase legacy)
  private userSubject = new BehaviorSubject<{uid?: string; email?: string} | null>(null);
  user$ = this.userSubject.asObservable();

  // Computed
  hasAdminRole = computed(() => {
    const user = this.currentUser();
    return user ? user.roles.includes('ADMIN') : false;
  });

  constructor() {
    // Cargar usuario desde localStorage al iniciar
    this.loadUserFromStorage();

    // Emitir cambios de currentUser en user$ para compatibilidad con Firebase legacy
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.userSubject.next({
          uid: user.uid || user.userId.toString(),
          email: user.email
        });
      } else {
        this.userSubject.next(null);
      }
    });
  }

  /**
   * Login en el backend
   * Guarda el token y usuario en localStorage
   */
  login(usernameOrEmail: string, password: string): Observable<LoginResponse> {
    const dto: LoginDTO = { usernameOrEmail, password };
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
   */
  register(username: string, email: string, password: string): Observable<any> {
    const dto: RegisterDTO = { username, email, password };
    return this.http
      .post(`${environment.apiUrl}/auth/register`, dto)
      .pipe(
        catchError((error) => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Login con Google usando el token de Google Sign-In
   */
  loginWithGoogle(googleToken: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/google`, { token: googleToken })
      .pipe(
        tap((response) => {
          this._saveAuthData(response);
        }),
        catchError((error) => {
          console.error('Google login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout: limpia localStorage y actualiza signals
   */
  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el token JWT del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.roles.includes(role) : false;
  }

  /**
   * Private: Guarda token y usuario en localStorage y actualiza signals
   */
  private _saveAuthData(response: LoginResponse): void {
    localStorage.setItem('jwtToken', response.token);

    const user: CurrentUser = {
      userId: response.userId,
      username: response.username,
      email: response.email,
      roles: response.roles,
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  /**
   * Private: Carga usuario desde localStorage al iniciar la app
   */
  private loadUserFromStorage(): void {
    const token = localStorage.getItem('jwtToken');
    const userStr = localStorage.getItem('currentUser');

    if (token && userStr) {
      try {
        const user: CurrentUser = JSON.parse(userStr);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }
}

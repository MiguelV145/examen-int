import { inject, Injectable, signal } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, from, of } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
private auth: Auth = inject(Auth);
  
  // Signal para el usuario actual
  currentUser = signal<User | null>(null);
  
  // Observable del estado de autenticación
  user$ = user(this.auth);

  constructor() {
    // Suscribirse a cambios en el estado de autenticación
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  /**
   * Registrar nuevo usuario con email y password
   */
  register(email: string, password: string): Observable<any> {
    const promise = createUserWithEmailAndPassword(this.auth, email, password);
    return from(promise);
  }

  /**
   * Login con email y password
   */
  login(email: string, password: string): Observable<any> {
    const promise = signInWithEmailAndPassword(this.auth, email, password);
    return from(promise);
  }

  /**
   * Login con Google
   */
 loginWithGoogle(): Observable<any> {
     const provider = new GoogleAuthProvider();
     const promise = signInWithPopup(this.auth, provider);
     return from(promise);
   }

  /**
   * Cerrar sesión
   */
  logout(): Observable<void> {
    const promise = signOut(this.auth);
    return from(promise);
  }

  /**
   * Verificar si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
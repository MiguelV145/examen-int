import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
// Importamos todo lo necesario de Firebase
import { Auth, user, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
// Importamos RxJS correctamente (ESTO ARREGLA EL ERROR DE 'from')
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserProfile } from '../../../features/share/Interfaces/Interfaces-Users';
// Tu interfaz personalizada

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // Inyecciones de dependencias
  private _auth = inject(Auth);
  private _firestore = inject(Firestore);
  private _router = inject(Router);

  // Signal para acceder al usuario actual desde la UI
  currentUser = signal<User | null>(null);

  // Observable nativo de Firebase Auth
  user$ = user(this._auth);

  constructor() {
    // Mantenemos el signal actualizado
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  // ==========================================================
  // 1. LOGIN CON GOOGLE (Requisito Principal)
  // ==========================================================
  loginWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    // Convertimos la promesa en Observable
    return from(signInWithPopup(this._auth, provider)).pipe(
      // Al terminar el login, verificamos el rol en Firestore
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  // ==========================================================
  // 2. LOGIN CON EMAIL (Para tu formulario login-page)
  // ==========================================================
  loginWithEmail(email: string, pass: string): Observable<void> {
    return from(signInWithEmailAndPassword(this._auth, email, pass)).pipe(
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  // ==========================================================
  // 3. LOGOUT
  // ==========================================================
  logout(): Observable<void> {
    return from(signOut(this._auth)).pipe(
      switchMap(() => {
        this._router.navigate(['/auth']); // Volver al login
        return of(undefined);
      })
    );
  }

  // Helper simple para saber si hay usuario
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  // ==========================================================
  // LÓGICA PRIVADA: GESTIÓN DE ROLES Y BASE DE DATOS
  // ==========================================================
  
  // Esta función decide qué hacer después de que Firebase dice "Login OK"
  private async _handleUserLogin(firebaseUser: User): Promise<void> {
    // Referencia al documento en la colección 'users'
    const userRef = doc(this._firestore, `users/${firebaseUser.uid}`);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // --- USUARIO EXISTENTE ---
      // Obtenemos sus datos para ver qué rol tiene
      const userData = userSnap.data() as UserProfile;
      this._redirectByRole(userData.role);
    } else {
      // --- USUARIO NUEVO ---
      // Lo creamos en la base de datos con tus campos
      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario Nuevo',
        // ASIGNAMOS ROL POR DEFECTO (usando tu nomenclatura)
        role: 'user', 
      };

      // Si tu interfaz acepta photoURL, agrégalo aquí también:
      // if (firebaseUser.photoURL) newUser['photoURL'] = firebaseUser.photoURL;

      await setDoc(userRef, newUser);
      this._redirectByRole('user');
    }
  }

  // Redirección según TUS roles específicos
  private _redirectByRole(role: string) {
    switch (role) {
      case 'admin':
        this._router.navigate(['/admin']);
        break;
      case 'Programador': // <--- Con mayúscula, como tú lo tienes
        this._router.navigate(['/panel']);
        break;
      case 'user': // <--- 'user' estándar
      default:
        this._router.navigate(['/']); // Home público
        break;
    }
  }
}
import { inject, Injectable, signal } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, from, of, switchMap } from 'rxjs';
import { UserProfile } from '../../../features/share/Interfaces/Interfaces-Users';
import { doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Signal para la UI
  currentUser = signal<User | null>(null);

  // Observable de autenticación
  user$ = user(this.auth);

  constructor() {
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  // ==========================================
  // MÉTODOS PÚBLICOS (Login / Logout / Registro)
  // ==========================================

  register(email: string, password: string): Observable<void> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        // Creamos el objeto exacto según tu interfaz
        const newUser: UserProfile = {
          uid: credential.user.uid,
          email: email,
          role: 'user', // Rol por defecto
          displayName: 'Usuario Nuevo',
          photoURL: ''
        };
        // Guardamos en Firestore
        await setDoc(doc(this.firestore, 'users', credential.user.uid), newUser);
        this.router.navigate(['/']);
      })
    );
  }

  login(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  loginWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      switchMap(() => {
        this.router.navigate(['/login']);
        return of(undefined);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  // ==========================================
  // LÓGICA PRIVADA (Roles y Base de Datos)
  // ==========================================

  private async _handleUserLogin(firebaseUser: User): Promise<void> {
    // Referencia al usuario en la BD
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // --- USUARIO YA REGISTRADO ---
      const userData = userSnap.data() as UserProfile;
      this._redirectByRole(userData.role);
    } else {
      // --- USUARIO NUEVO (Primera vez con Google) ---

      // 1. Verificamos si el admin lo invitó por correo
      // (Buscamos si existe un doc con ID = email)
      const inviteRef = doc(this.firestore, `users/${firebaseUser.email}`);
      const inviteSnap = await getDoc(inviteRef);

      // Definimos el rol inicial
      let assignedRole: 'user' | 'Programador' = 'user';

      if (inviteSnap.exists()) {
        const inviteData = inviteSnap.data();
        // Si la invitación dice 'Programador', le damos el rol
        if (inviteData && inviteData['role'] === 'Programador') {
          assignedRole = 'Programador';
        }
      }

      // 2. Creamos el perfil oficial en Firestore
      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario Google',
        photoURL: firebaseUser.photoURL || '',
        role: assignedRole // Aquí asignamos 'user' o 'Programador'
      };

      await setDoc(userRef, newUser);
      this._redirectByRole(assignedRole);
    }
  }

  private _redirectByRole(role: string) {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'Programador': // <--- Respetando tu mayúscula
        this.router.navigate(['/panel']);
        break;
      default:
        this.router.navigate(['/']); // Home
        break;
    }
  }
}
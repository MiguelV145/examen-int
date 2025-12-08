import { inject, Injectable, signal } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, from, of, switchMap } from 'rxjs';
import { UserProfile } from '../../../features/share/Interfaces/Interfaces-Users';
import { deleteDoc, doc, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  user$ = user(this.auth);

  constructor() {
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  // ... (Tus métodos register, login, loginWithGoogle y logout están perfectos, déjalos igual) ...
  register(email: string, password: string): Observable<void> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        const newUser: UserProfile = {
          uid: credential.user.uid,
          email: email,
          role: 'user',
          displayName: 'Usuario Nuevo',
          photoURL: ''
        };
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
  // LÓGICA PRIVADA MEJORADA
  // ==========================================

  private async _handleUserLogin(firebaseUser: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // --- USUARIO YA REGISTRADO ---
      const userData = userSnap.data() as UserProfile;
      
      // MEJORA 1: Actualizar datos por si cambió su foto o nombre en Google
      // Esto asegura que tu base de datos siempre tenga la info fresca
      await updateDoc(userRef, {
        photoURL: firebaseUser.photoURL || userData.photoURL,
        displayName: firebaseUser.displayName || userData.displayName,
        email: firebaseUser.email // Por si acaso
      });

      this._redirectByRole(userData.role);
    } else {
      // --- USUARIO NUEVO ---

      // Buscamos si existe invitación por correo
      // (Documento creado por el Admin donde el ID es el email)
      const inviteRef = doc(this.firestore, `users/${firebaseUser.email}`);
      const inviteSnap = await getDoc(inviteRef);

      let assignedRole: 'user' | 'Programador' = 'user';

      if (inviteSnap.exists()) {
        const inviteData = inviteSnap.data();
        if (inviteData && inviteData['role'] === 'Programador') {
          assignedRole = 'Programador';
          
          // MEJORA 2 (CRÍTICA): BORRAR LA INVITACIÓN
          // Si no la borras, en la tabla de admin saldrá este usuario DUPLICADO:
          // 1. Como "juan@gmail.com" (la invitación)
          // 2. Como "uid_xyz123" (el usuario real)
          await deleteDoc(inviteRef); 
        }
      }

      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario Google',
        photoURL: firebaseUser.photoURL || '',
        role: assignedRole
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
      case 'Programador':
        this.router.navigate(['/panel']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }
}
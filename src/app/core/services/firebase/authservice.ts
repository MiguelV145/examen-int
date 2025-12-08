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

  // --- REGISTRO ---
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
        
        // CAMBIO: Redirigir siempre a /home
        this.router.navigate(['/home']);
      })
    );
  }

  // --- LOGIN EMAIL ---
  login(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  // --- LOGIN GOOGLE ---
  loginWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  // --- LOGOUT ---
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
  // LÓGICA PRIVADA
  // ==========================================

  private async _handleUserLogin(firebaseUser: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Usuario ya existe: Actualizamos datos básicos y redirigimos
      const userData = userSnap.data() as UserProfile;
      
      await updateDoc(userRef, {
        photoURL: firebaseUser.photoURL || userData.photoURL,
        displayName: firebaseUser.displayName || userData.displayName,
        email: firebaseUser.email
      });

      // Redirigimos (ya no importa el rol)
      this._redirectALwaysToHome();
    } else {
      // Usuario Nuevo: Verificamos invitaciones
      const inviteRef = doc(this.firestore, `users/${firebaseUser.email}`);
      const inviteSnap = await getDoc(inviteRef);

      let assignedRole: 'user' | 'Programador' = 'user';

      if (inviteSnap.exists()) {
        const inviteData = inviteSnap.data();
        if (inviteData && inviteData['role'] === 'Programador') {
          assignedRole = 'Programador';
          await deleteDoc(inviteRef); // Borramos invitación
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
      this._redirectALwaysToHome();
    }
  }

  // CAMBIO PRINCIPAL: Esta función ahora ignora el rol
  private _redirectALwaysToHome() {
    this.router.navigate(['/home']);
  }
}
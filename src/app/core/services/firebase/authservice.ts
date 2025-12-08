import { inject, Injectable, signal } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, from, of, switchMap } from 'rxjs';
import { UserProfile } from '../../../features/share/Interfaces/Interfaces-Users';
import { deleteDoc, doc, docData, Firestore, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  // 1. NUEVA SEÑAL PARA EL ROL
  currentRole = signal<string | null>(null);

  user$ = user(this.auth);

  constructor() {
    // 2. MODIFICAMOS EL CONSTRUCTOR
    // Cuando detectamos un usuario, vamos a buscar su rol a la base de datos automáticamente
    this.user$.pipe(
      switchMap(user => {
        if (user) {
          this.currentUser.set(user);
          // Escuchamos el documento del usuario en tiempo real
          return docData(doc(this.firestore, 'users', user.uid));
        } else {
          this.currentUser.set(null);
          return of(null);
        }
      })
    ).subscribe((data: any) => {
      if (data) {
        // Si encontramos datos, guardamos el rol
        this.currentRole.set(data.role);
      } else {
        this.currentRole.set(null);
      }
    });
  }

  // 3. NUEVA FUNCIÓN PARA USAR EN EL HTML
  hasRole(role: string): boolean {
    return this.currentRole() === role;
  }

  // --- REGISTRO, LOGIN Y DEMÁS (IGUAL QUE ANTES) ---
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
        this.router.navigate(['/home']);
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
        this.currentRole.set(null); // Limpiamos el rol al salir
        this.router.navigate(['/login']);
        return of(undefined);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  private async _handleUserLogin(firebaseUser: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      await updateDoc(userRef, {
        photoURL: firebaseUser.photoURL || userData.photoURL,
        displayName: firebaseUser.displayName || userData.displayName,
        email: firebaseUser.email
      });
      this.router.navigate(['/home']);
    } else {
      const inviteRef = doc(this.firestore, `users/${firebaseUser.email}`);
      const inviteSnap = await getDoc(inviteRef);
      let assignedRole: 'user' | 'Programador' = 'user';

      if (inviteSnap.exists()) {
        const inviteData = inviteSnap.data();
        if (inviteData && inviteData['role'] === 'Programador') {
          assignedRole = 'Programador';
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
      this.router.navigate(['/home']);
    }
  }
}
import { inject, Injectable,signal } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Auth, user, createUserWithEmailAndPassword, signInWithEmailAndPassword, User, signOut, UserProfile, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private auth: Auth= inject(Auth);

  currentUser = signal<User | null>(null);

  user$ = user(this.auth);

  constructor() {
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }
  
  login(email: string, password: string): Observable<any> {
    const promise = signInWithEmailAndPassword(this.auth, email, password);
    return from(promise);
  }

   loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
      const promise = signInWithPopup(this.auth, provider);
    return from(promise);
     }
  

   logout(): Observable<void> {
    const promise = signOut(this.auth);
    return from(promise);
  }


  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}

function from(promise: any): Observable<any> {
  throw new Error('Function not implemented.');
}


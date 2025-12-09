import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { map, switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { UserProfile } from '../../features/share/Interfaces/Interfaces-Users';

export const adminGuard: CanActivateFn = (route, state) => {
 const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    switchMap(user => {
      if (!user) return of(router.createUrlTree(['/login']));

      const userRef = doc(firestore, 'users', user.uid);
      return from(getDoc(userRef)).pipe(
        map(snapshot => {
          const userData = snapshot.data() as UserProfile;
          // SOLO PASA SI ES ADMIN
          if (userData && userData.role === 'admin') {
            return true;
          }
          // Si no es admin, lo mandamos al Home
          return router.createUrlTree(['/home']);
        })
      );
    })
  );
};
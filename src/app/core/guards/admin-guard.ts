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
      // 1. Si no hay usuario logueado, fuera.
      if (!user) {
        return of(router.createUrlTree(['/auth']));
      }

      // 2. Si hay usuario, vamos a buscar su documento a Firestore
      const userRef = doc(firestore, 'users', user.uid);
      
      // Convertimos la promesa de getDoc en un Observable
      return from(getDoc(userRef)).pipe(
        map(snapshot => {
          const userData = snapshot.data() as UserProfile;
          
          // 3. Verificamos el rol
          if (userData && userData.role === 'admin') {
            return true; // Es admin, pase.
          } else {
            // Está logueado pero NO es admin (intruso)
            return router.createUrlTree(['/']); // Lo mandamos al home
          }
        })
      );
    })
  );
};
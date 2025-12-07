import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);     // Inyectamos Firebase Auth
  const router = inject(Router); // Inyectamos el Router para redirigir

  // authState es un Observable que nos dice si hay usuario o null
  return authState(auth).pipe(
    take(1), // Tomamos solo el primer valor y cerramos la suscripción
    map(user => {
      if (user) {
        return true; // ¡Pase usted!
      } else {
        // Si no hay usuario, redirigir al Login
        return router.createUrlTree(['/auth']); 
      }
    })
  );
};
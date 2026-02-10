import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStoreService } from '../services/auth/auth-store.service';

/**
 * Guard que bloquea el acceso a rutas públicas (login, register)
 * si el usuario ya está autenticado
 * Redirige a /home si intenta acceder a /login estando logueado
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStoreService } from '../services/auth/auth-store.service';

/**
 * Guard que protege rutas requiriendo autenticación
 * Redirige a /login si no está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
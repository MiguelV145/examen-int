import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStoreService } from '../services/auth/auth-store.service';

/**
 * Guard que protege rutas requiriendo rol ADMIN
 * Redirige a /login si no está autenticado
 * Redirige a /home si está autenticado pero no es ADMIN
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  // Si no está autenticado
  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Si está autenticado y es ADMIN
  if (authStore.isAdmin()) {
    return true;
  }

  // Si está autenticado pero no es ADMIN
  return router.createUrlTree(['/home']);
};
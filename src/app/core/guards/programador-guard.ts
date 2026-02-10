import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStoreService } from '../services/auth/auth-store.service';

/**
 * Guard que protege rutas requiriendo rol PROGRAMADOR
 * Redirige a /login si no está autenticado
 * Redirige a /home si está autenticado pero no es PROGRAMADOR
 */
export const programadorGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  // Si no está autenticado
  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Si está autenticado, verificar si tiene rol PROGRAMADOR
  if (authStore.hasRole('ROLE_PROGRAMADOR')) {
    return true;
  }

  // Si está autenticado pero no es PROGRAMADOR
  return router.createUrlTree(['/home']);
};

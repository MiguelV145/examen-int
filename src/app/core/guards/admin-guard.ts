import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard que protege rutas requiriendo rol ADMIN
 * Redirige a /login si no está autenticado
 * Redirige a /home si está autenticado pero no es ADMIN
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no está autenticado
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Si está autenticado y es ADMIN
  if (authService.hasRole('ADMIN')) {
    return true;
  }

  // Si está autenticado pero no es ADMIN
  return router.createUrlTree(['/home']);
};
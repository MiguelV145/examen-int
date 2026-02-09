import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard que bloquea el acceso a rutas públicas (login, register)
 * si el usuario ya está autenticado
 * Redirige a /home si intenta acceder a /login estando logueado
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};

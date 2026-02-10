import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor que agrega automáticamente el token JWT a todas las requests
 * Excepto a /auth/login y /auth/register
 * Si recibe 401, hace logout y redirige a /login
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // URLs que NO deben llevar token
  const publicUrls = ['/auth/login', '/auth/register'];

  // Verificar si la URL actual es pública
  const isPublicUrl = publicUrls.some((url) => req.url.includes(url));

  if (isPublicUrl) {
    // Pasar request sin modificar
    return next(req);
  }

  // Obtener el token del servicio
  const token = authService.getToken();

  let authReq = req;

  if (token) {
    // Log solo para peticiones a /api/users (debugging)
    if (req.url.includes('/api/users')) {
      console.log('🔐 Interceptor: Agregando token a petición:', req.url);
      console.log('🎫 Token (primeros 50 chars):', token.substring(0, 50) + '...');
    }
    
    // Clonar request y agregar header Authorization
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else {
    // Log de warning si no hay token pero se intenta acceder a una ruta protegida
    if (req.url.includes('/api/')) {
      console.warn('⚠️ Interceptor: No hay token disponible para:', req.url);
    }
  }

  // Manejar errores 401
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token inválido o expirado: hacer logout y redirigir
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

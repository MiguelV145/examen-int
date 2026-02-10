import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStoreService } from '../services/auth/auth-store.service';
import { Router } from '@angular/router';

/**
 * Interceptor funcional para JWT
 * - Agrega header Authorization: Bearer <token> en todas las requests (excepto login/register)
 * - NO usa withCredentials
 * - Maneja 401 haciendo logout
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  // URLs públicas que NO necesitan token
  const publicUrls = ['/api/auth/login', '/api/auth/register'];
  const isPublicUrl = publicUrls.some((url) => req.url.includes(url));

  // Si es URL pública, pasar sin modificar
  if (isPublicUrl) {
    return next(req);
  }

  // Obtener token del store
  const token = authStore.token();

  // Si hay token, agregar header Authorization
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Manejar respuesta y errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si 401 Unauthorized, hacer logout
      if (error.status === 401) {
        authStore.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStoreService } from '../services/auth/auth-store.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * Interceptor funcional para JWT
 * - Agrega header Authorization: Bearer <token> solo a requests a environment.apiUrl
 * - NO usa withCredentials
 * - Maneja 401 haciendo logout
 * - Excepta URLs públicas: /api/auth/login y /api/auth/register
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  // URLs públicas que NO necesitan token
  const publicUrls = ['/api/auth/login', '/api/auth/register'];
  const isPublicUrl = publicUrls.some((url) => req.url.includes(url));

  // Verificar si la request est hacia environment.apiUrl
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // Si es URL pública o no es hacia nuestra API, pasar sin modificar
  if (isPublicUrl || !isApiUrl) {
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

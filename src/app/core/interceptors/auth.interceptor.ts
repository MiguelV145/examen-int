import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

/**
 * Interceptor que agrega automáticamente el token JWT a todas las requests
 * Excepto a /auth/login y /auth/register
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

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

  if (token) {
    // Clonar request y agregar header Authorization
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};

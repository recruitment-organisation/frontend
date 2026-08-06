import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const router = inject(Router);

  const isAuthRequest =
    req.url.includes('/login') ||
    req.url.includes('/refresh-token') ||
    req.url.includes('/logout');

  let authReq = req;

  if (!isAuthRequest) {
    const token = authService.getToken();

    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            const refreshedToken = authService.getToken();
            if (!refreshedToken) return throwError(() => error);
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${refreshedToken}` } }));
          }),
          catchError(refreshError => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === 403) {
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};

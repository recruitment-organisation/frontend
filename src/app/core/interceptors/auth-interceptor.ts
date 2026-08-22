import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';
import { LoginResponse } from '../models/auth/login-response';
import { Auth } from '../services/auth';

let refreshInFlight$: Observable<LoginResponse> | null = null;

function addBearerToken(
  request: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function refreshSessionOnce(authService: Auth): Observable<LoginResponse> {
  if (!refreshInFlight$) {
    refreshInFlight$ = authService.refreshToken().pipe(
      catchError(error => {
        authService.logout();
        return throwError(() => error);
      }),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({
        bufferSize: 1,
        refCount: false
      })
    );
  }

  return refreshInFlight$;
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(Auth);
  const router = inject(Router);

  const isAuthRequest =
    request.url.includes('/login') ||
    request.url.includes('/refresh-token') ||
    request.url.includes('/logout');

  const requestToken = isAuthRequest ? null : authService.getToken();
  const authenticatedRequest = requestToken
    ? addBearerToken(request, requestToken)
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest) {
        const currentToken = authService.getToken();

        if (currentToken && currentToken !== requestToken) {
          return next(addBearerToken(request, currentToken));
        }

        return refreshSessionOnce(authService).pipe(
          switchMap(() => {
            const refreshedToken = authService.getToken();

            if (!refreshedToken) return throwError(() => error);

            return next(addBearerToken(request, refreshedToken));
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

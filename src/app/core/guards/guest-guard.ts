import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Auth } from '../services/auth';

/** Prevents an authenticated user from returning to authentication screens. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map(isAuthenticated => isAuthenticated
      ? router.createUrlTree([auth.getDefaultRoute()])
      : true)
  );
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map(success => {
      if (success) {
        return true;
      }

      return router.createUrlTree(
        ['/auth/login'],
        {
          queryParams: {
            returnUrl: state.url
          }
        }
      );
    })
  );
};

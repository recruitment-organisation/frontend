import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(Auth);
    const router = inject(Router);

    const hasAccess = allowedRoles.some((role) => authService.hasRole(role));

    if (!hasAccess) {
      return router.createUrlTree(['/unauthorized']);
    }

    return true;
  };
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getStoredAuthToken } from '../utils/auth-token';

/** Backoffice pages need a Super Admin session; the API still enforces access on every call. */
export const authGuard: CanActivateFn = () => {
  if (getStoredAuthToken('admin_token') && localStorage.getItem('admin_data')) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};

import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const AuthGuard: () => Observable<boolean | UrlTree> = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.verifyAuthStatus().pipe(
    map((isLoggedIn) => {
      if (!isLoggedIn) {
        return router.parseUrl('/login');
      }
      return isLoggedIn;
    })
  );
};

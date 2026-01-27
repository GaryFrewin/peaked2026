import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth-guard';
import { of } from 'rxjs';

describe('AuthGuard', () => {
  let router: Router;
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            parseUrl: jasmine.createSpy('parseUrl').and.returnValue({} as UrlTree)
          }
        }
      ]
    });
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should allow navigation when authenticated', (done) => {
    TestBed.runInInjectionContext(() => {
      const guard = AuthGuard();
      
      guard.subscribe({
        next: (result) => {
          expect(result).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne('https://192.168.0.113:5000/auth/verify');
      req.flush({ success: true });
    });
  });

  it('should redirect to login when not authenticated', (done) => {
    const mockUrlTree = {} as UrlTree;
    (router.parseUrl as jasmine.Spy).and.returnValue(mockUrlTree);

    TestBed.runInInjectionContext(() => {
      const guard = AuthGuard();
      
      guard.subscribe({
        next: (result) => {
          expect(result).toBe(mockUrlTree);
          expect(router.parseUrl).toHaveBeenCalledWith('/login');
          done();
        }
      });

      const req = httpMock.expectOne('https://192.168.0.113:5000/auth/verify');
      req.flush({ success: false });
    });
  });

  it('should call verifyAuthStatus on check', (done) => {
    spyOn(authService, 'verifyAuthStatus').and.returnValue(of(true));

    TestBed.runInInjectionContext(() => {
      const guard = AuthGuard();
      
      guard.subscribe({
        next: () => {
          expect(authService.verifyAuthStatus).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('should return UrlTree for unauthenticated access', (done) => {
    const mockUrlTree = { toString: () => '/' } as UrlTree;
    (router.parseUrl as jasmine.Spy).and.returnValue(mockUrlTree);

    TestBed.runInInjectionContext(() => {
      const guard = AuthGuard();
      
      guard.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(Object);
          expect(result).not.toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne('https://192.168.0.113:5000/auth/verify');
      req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });
});

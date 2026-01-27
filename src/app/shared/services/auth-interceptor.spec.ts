import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    localStorage.setItem('idToken', 'test-token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should not modify request when no token exists', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should include Bearer prefix in Authorization header', () => {
    localStorage.setItem('idToken', 'my-jwt-token');

    http.get('/api/protected').subscribe();

    const req = httpMock.expectOne('/api/protected');
    const authHeader = req.request.headers.get('Authorization');
    expect(authHeader).toBe('Bearer my-jwt-token');
    expect(authHeader?.startsWith('Bearer ')).toBe(true);
    req.flush({});
  });

  it('should pass through request to next handler', () => {
    localStorage.setItem('idToken', 'test-token');

    http.post('/api/data', { test: 'data' }).subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ test: 'data' });
    req.flush({ success: true });
  });

  it('should handle requests without token gracefully', () => {
    http.get('/api/public').subscribe();

    const req = httpMock.expectOne('/api/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ data: 'public' });
  });
});

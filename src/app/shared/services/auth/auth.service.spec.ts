import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = 'https://192.168.0.113:5000';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with unauthenticated state', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should login and store token in localStorage', (done) => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockResponse = {
      success: true,
      data: {
        idToken: 'mock-jwt-token'
      }
    };

    service.login(email, password).subscribe({
      next: (response) => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('idToken')).toBe('mock-jwt-token');
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email, password });
    req.flush(mockResponse);
  });

  it('should set isAuthenticated to true after successful login', (done) => {
    const mockResponse = {
      success: true,
      data: {
        idToken: 'mock-jwt-token'
      }
    };

    expect(service.isAuthenticated()).toBe(false);

    service.login('test@example.com', 'password').subscribe({
      next: () => {
        expect(service.isAuthenticated()).toBe(true);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    req.flush(mockResponse);
  });

  it('should logout and clear token from localStorage', () => {
    localStorage.setItem('idToken', 'test-token');
    service.logout();
    expect(localStorage.getItem('idToken')).toBeNull();
  });

  it('should set isAuthenticated to false after logout', () => {
    localStorage.setItem('idToken', 'test-token');
    service.isAuthenticated.set(true);
    
    service.logout();
    
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return token from localStorage', () => {
    localStorage.setItem('idToken', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should return null when no token exists', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should verify auth status via API call when token exists', (done) => {
    localStorage.setItem('idToken', 'test-token');
    const mockResponse = { success: true };

    service.verifyAuthStatus().subscribe({
      next: (isAuthenticated) => {
        expect(isAuthenticated).toBe(true);
        expect(service.isAuthenticated()).toBe(true);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle login error and remain unauthenticated', (done) => {
    service.login('test@example.com', 'wrong-password').subscribe({
      error: (error) => {
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('idToken')).toBeNull();
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should set isAuthenticated to false when verify fails', (done) => {
    localStorage.setItem('idToken', 'invalid-token');
    service.isAuthenticated.set(true);

    service.verifyAuthStatus().subscribe({
      next: (isAuthenticated) => {
        expect(isAuthenticated).toBe(false);
        expect(service.isAuthenticated()).toBe(false);
        done();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
    req.flush({ error: 'Invalid token' }, { status: 401, statusText: 'Unauthorized' });
  });
});

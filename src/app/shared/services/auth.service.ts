import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://192.168.0.113:5000';

  readonly isAuthenticated = signal<boolean>(false);

  login(email: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/auth/login`;
    const payload = { email, password };
    
    return this.http.post<any>(url, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      map((response: any) => {
        if (response?.data?.idToken) {
          localStorage.setItem('idToken', response.data.idToken);
          this.isAuthenticated.set(true);
        }
        return response;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('idToken');
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem('idToken');
  }

  verifyAuthStatus(): Observable<boolean> {
    return this.http
      .get(`${this.apiUrl}/auth/verify`, { withCredentials: true })
      .pipe(
        map((res: any) => {
          const isLoggedIn = res.success;
          this.isAuthenticated.set(isLoggedIn);
          return isLoggedIn;
        }),
        catchError(() => {
          this.isAuthenticated.set(false);
          return of(false);
        })
      );
  }
}

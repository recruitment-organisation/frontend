import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CreateUserRequest } from '../models/auth/create-user-request';
import { LoginRequest } from '../models/auth/login-request';
import { LoginResponse } from '../models/auth/login-response';
import { LogoutRequest } from '../models/auth/logout-request';
import { environment } from '../../../enviroment/enviroment';
import { RefreshTokenRequest } from '../models/auth/refresh-token-request';
import { CurrentUser } from '../models/auth/current-user';

import { Observable, tap, of, catchError, map, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly router = inject(Router);
  private readonly baseUrl =  `${environment.apiUrl}auth-service/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly EXPIRES_KEY = 'expires_at';
  private readonly USER_KEY = 'current_user';


  constructor(private http: HttpClient) {}

  signup(request: CreateUserRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/signup`, request, {
      responseType: 'text'
    });
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.storeSession(response))
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    const payload: LogoutRequest = { refreshToken: refreshToken ?? '' };

    this.clearSession();
    this.router.navigate(['/auth/login']);
    if (!refreshToken) return;
    this.http.post<void>(`${this.baseUrl}/logout`, payload).subscribe({ error: () => undefined });
  }

  userExists(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<boolean>(`${this.baseUrl}/exist`, { params });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }

  updateMyAccount(payload: { email?: string; password?: string }): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/me`, payload).pipe(
      tap(() => {
        if (!payload.email) return;
        const user = this.getCurrentUser();
        if (!user) return;
        localStorage.setItem(this.USER_KEY, JSON.stringify({ ...user, email: payload.email }));
      })
    );
  }

  getDefaultRoute(): string {
    const roles = this.getRoles();

    if (roles.includes('CANDIDATE')) {
      return '/candidate/dashboard';
    }

    if (roles.includes('HR')) {
      return '/hr';
    }

    if (roles.includes('MANAGER')) {
      return '/manager';
    }

    if (roles.includes('EMPLOYEE')) {
      return '/employee/dashboard';
    }

    return '/auth/login';
  }

  private storeSession(response: LoginResponse): void {
    if (!this.isValidLoginResponse(response)) {
      throw new Error('Invalid authentication response.');
    }
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_KEY, response.refreshToken);

    const expiresAt = Date.now() + response.expiresIn * 1000;
    localStorage.setItem(this.EXPIRES_KEY, expiresAt.toString());

    const user: CurrentUser = {
      username: response.username,
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      roles: response.roles,
      userId: response.userId
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    if (expiresAt && Date.now() > Number(expiresAt)) {
      return false;
    }

    return true;
  }

  getCurrentUser(): CurrentUser | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  getRoles(): string[] {
    return this.getCurrentUser()?.roles ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getRoles();
    return roles.some((r) => userRoles.includes(r));
  }
  
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken?.trim()) return throwError(() => new Error('No refresh token available.'));
    const payload: RefreshTokenRequest = { refreshToken };

    return this.http.post<LoginResponse>(
      `${this.baseUrl}/refresh-token`,
      payload
    ).pipe(
      tap(res => {
        this.storeSession(res);
      })
    );
  }

  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return true;
    return Date.now() > Number(expiresAt);
  }

  private isValidLoginResponse(response: LoginResponse | null | undefined): response is LoginResponse {
    return !!response
      && typeof response.accessToken === 'string' && response.accessToken.length > 0
      && typeof response.refreshToken === 'string' && response.refreshToken.length > 0
      && typeof response.expiresIn === 'number' && Number.isFinite(response.expiresIn) && response.expiresIn > 0
      && typeof response.id === 'string' && response.id.length > 0
      && typeof response.username === 'string'
      && typeof response.email === 'string'
      && typeof response.firstName === 'string'
      && typeof response.lastName === 'string'
      && Array.isArray(response.roles);
  }

  restoreSession(): Observable<boolean> {
    if (this.isLoggedIn()) {
      return of(true);
    }

    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearSession();
      return of(false);
    }

    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }
}

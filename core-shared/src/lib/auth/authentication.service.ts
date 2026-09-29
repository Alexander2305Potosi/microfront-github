import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { Observable, of } from 'rxjs';

export interface TokenDecode {
  name?: string;
  unique_name?: string;
  preferred_username?: string;
  roles?: string[];
  [key: string]: any;
}

export class User {
  constructor(public name: string, public email: string) {}
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  // URLs de ejemplo: En un proyecto real deberías usar environment.ts
  readonly API = 'http://localhost:3000/api'; 
  readonly LOGOUT = 'http://localhost:3000/api'; 

  constructor(
    private msalService: MsalService,
    private http: HttpClient
  ) {}

  login() {
    this.msalService.loginPopup().subscribe({
      next: (response) => {
        this.msalService.instance.setActiveAccount(response.account);
        // Opcional: Llama a tu backend tras el login exitoso
        this.saveSessionToken(this.getEmail()).subscribe();
      },
      error: (error) => console.error(error)
    });
  }

  logOut() {
    this.closeSessionToken().subscribe({
      next: () => this.msalService.logoutPopup(),
      error: () => this.msalService.logoutPopup()
    });
  }

  authenticated(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  private getAccount() {
    return this.msalService.instance.getActiveAccount() || this.msalService.instance.getAllAccounts()[0];
  }

  getUserName(): string {
    const account = this.getAccount();
    return account?.name || '';
  }

  getEmail(): string {
    const account = this.getAccount();
    return account?.username || (account?.idTokenClaims as TokenDecode)?.preferred_username || '';
  }

  getDataUserAndEmail(): User {
    return new User(this.getUserName(), this.getEmail());
  }

  getToken(): string {
    const account = this.getAccount();
    // MSAL maneja los tokens internamente. Si necesitas el ID Token puro:
    return account?.idToken || ''; 
  }

  // En MSAL, no es necesario hacer window.atob manualmente.
  // La librería ya decodifica el token JWT y lo guarda en idTokenClaims.
  getParsedToken(): TokenDecode {
    const account = this.getAccount();
    return (account?.idTokenClaims as TokenDecode) || {};
  }

  hasPermission(permissions: string[]): boolean {
    const claims = this.getParsedToken();
    const userRoles = claims.roles || [];
    return permissions.every(permission => userRoles.includes(permission));
  }

  // --- Integración con Backend (Sesiones) ---

  saveSessionToken(email: string): Observable<any> {
    const ENDPOINT = `${this.API}/sessions/save`;
    const params = new FormData();
    params.append('email', email);
    return this.http.post(ENDPOINT, params);
  }

  closeSessionToken(): Observable<any> {
    // Si el usuario no está autenticado, no hacer el llamado
    if (!this.authenticated()) return of(null);
    const ENDPOINT = `${this.LOGOUT}/logout`;
    return this.http.delete(ENDPOINT);
  }

  closeSessionWithEmail(): Observable<any> {
    const ENDPOINT = `${this.API}/sessions/close?email=${this.getEmail()}`;
    return this.http.get(ENDPOINT);
  }

  validateSessionToken(email: string): Observable<any> {
    const params = new FormData();
    params.append('email', email);
    const ENDPOINT = `${this.API}/sessions/validate`;
    return this.http.post(ENDPOINT, params);
  }
}

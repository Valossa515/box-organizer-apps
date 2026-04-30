import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { environment } from '../environments/environment';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'token';            // ID token (Bearer enviado ao backend — `aud` = clientId)
const REFRESH_KEY = 'refresh_token';
const PKCE_VERIFIER_KEY = 'pkce_verifier';
const PKCE_STATE_KEY = 'pkce_state';

interface CognitoTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Integração com AWS Cognito Hosted UI (OAuth2 Authorization Code + PKCE).
 *
 * Fluxo:
 *  - login() / register() → redireciona para Hosted UI
 *  - callback /auth/callback → handleCallback() troca o `code` por tokens
 *  - logout() → limpa storage e redireciona ao endpoint /logout do Cognito
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: Router) {}

  // ---------- API pública ----------

  async login(): Promise<void> {
    await this.redirectToHostedUi('login');
  }

  async register(): Promise<void> {
    await this.redirectToHostedUi('signup');
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const savedState = (await Preferences.get({ key: PKCE_STATE_KEY })).value;
    const verifier = (await Preferences.get({ key: PKCE_VERIFIER_KEY })).value;

    if (!savedState || savedState !== state) {
      throw new Error('State inválido no retorno do Cognito');
    }
    if (!verifier) {
      throw new Error('PKCE verifier ausente');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: environment.cognito.clientId,
      code,
      redirect_uri: environment.cognito.redirectUri,
      code_verifier: verifier
    });

    const tokenUrl = `https://${environment.cognito.domain}/oauth2/token`;
    const res = await axios.post<CognitoTokenResponse>(tokenUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    await this.setTokens(res.data);
    await Preferences.remove({ key: PKCE_VERIFIER_KEY });
    await Preferences.remove({ key: PKCE_STATE_KEY });
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: REFRESH_KEY });

    const url = new URL(`https://${environment.cognito.domain}/logout`);
    url.searchParams.set('client_id', environment.cognito.clientId);
    url.searchParams.set('logout_uri', environment.cognito.logoutUri);
    window.location.href = url.toString();
  }

  async getToken(): Promise<string | null> {
    const result = await Preferences.get({ key: TOKEN_KEY });
    return result.value ?? null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  async refreshTokens(): Promise<boolean> {
    const refresh = (await Preferences.get({ key: REFRESH_KEY })).value;
    if (!refresh) return false;

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: environment.cognito.clientId,
        refresh_token: refresh
      });
      const res = await axios.post<CognitoTokenResponse>(
        `https://${environment.cognito.domain}/oauth2/token`,
        body.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      // Cognito não devolve refresh_token em refresh; preserva o existente.
      await Preferences.set({ key: TOKEN_KEY, value: res.data.id_token });
      return true;
    } catch {
      await Preferences.remove({ key: TOKEN_KEY });
      await Preferences.remove({ key: REFRESH_KEY });
      return false;
    }
  }

  // ---------- helpers internos ----------

  private async redirectToHostedUi(initialScreen: 'login' | 'signup'): Promise<void> {
    const verifier = this.randomUrlSafe(64);
    const challenge = await this.pkceChallenge(verifier);
    const state = this.randomUrlSafe(32);

    await Preferences.set({ key: PKCE_VERIFIER_KEY, value: verifier });
    await Preferences.set({ key: PKCE_STATE_KEY, value: state });

    const url = new URL(`https://${environment.cognito.domain}/oauth2/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', environment.cognito.clientId);
    url.searchParams.set('redirect_uri', environment.cognito.redirectUri);
    url.searchParams.set('scope', environment.cognito.scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    if (initialScreen === 'signup') {
      // Hosted UI mostra a aba de cadastro
      url.pathname = '/signup';
    }

    window.location.href = url.toString();
  }

  private async setTokens(t: CognitoTokenResponse): Promise<void> {
    await Preferences.set({ key: TOKEN_KEY, value: t.id_token });
    if (t.refresh_token) {
      await Preferences.set({ key: REFRESH_KEY, value: t.refresh_token });
    }
  }

  private randomUrlSafe(byteLength: number): string {
    const arr = new Uint8Array(byteLength);
    crypto.getRandomValues(arr);
    return this.base64Url(arr);
  }

  private async pkceChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64Url(new Uint8Array(digest));
  }

  private base64Url(bytes: Uint8Array): string {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
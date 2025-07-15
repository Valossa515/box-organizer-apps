import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { environment } from '../environments/environment';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private router: Router) { }

  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${environment.apiUrl}/auth/v1/login`, {
        email: credentials.email,
        password: credentials.password
      });

      const token = response.data?.token;

      if (token) {
        await this.setToken(token);
        return { success: true };
      } else {
        return { success: false, error: 'Login inválido' };
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.[0]?.description;

      if (errorMessage?.toLowerCase().includes('e-mail') && errorMessage?.toLowerCase().includes('Confirmação')) {
        return { success: false, error: 'Confirmação de e-mail pendente. Por favor, confirme seu e-mail para acessar o sistema.' };
      }

      return { success: false, error: 'Usuário ou senha inválidos' };
    }
  }

  async setToken(token: string): Promise<void> {
    await Preferences.set({ key: 'token', value: token });
  }

  async getToken(): Promise<string | null> {
    const result = await Preferences.get({ key: 'token' });
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
    } catch (e) {
      return true;
    }
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: 'token' });
    this.router.navigate(['']);
  }
}
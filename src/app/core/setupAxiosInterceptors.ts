import axios from 'axios';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    Capacitor?: any;
    cordova?: any;
  }
}

const TOKEN_KEY = 'token';

export function setupAxiosInterceptors(router: Router) {
  axios.interceptors.request.use(async config => {
    const url = config.url ?? '';
    const isCognito = url.includes('/oauth2/');

    const isMobile = window?.Capacitor?.isNativePlatform?.() || window?.cordova;
    config.headers['X-Client-Type'] = isMobile ? 'mobile' : 'web';

    // Requisições para o Cognito (token endpoint, etc.) não recebem nosso Bearer.
    if (isCognito) return config;

    // Apenas anexa o Bearer em chamadas para a API.
    const isApiCall = url.startsWith(environment.apiUrl) || url.startsWith('/');
    if (!isApiCall) return config;

    const tokenResult = await Preferences.get({ key: TOKEN_KEY });
    const token = tokenResult.value;

    if (!token) return config;

    if (isTokenExpired(token)) {
      await Preferences.remove({ key: TOKEN_KEY });
      router.navigate(['/']);
      return Promise.reject(new Error('Token expirado'));
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  axios.interceptors.response.use(
    response => response,
    async error => {
      const url = error?.config?.url ?? '';
      const isCognito = url.includes('/oauth2/');

      if (error.response?.status === 401 && !isCognito) {
        await Preferences.remove({ key: TOKEN_KEY });
        router.navigate(['/']);
      }

      return Promise.reject(error);
    }
  );
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

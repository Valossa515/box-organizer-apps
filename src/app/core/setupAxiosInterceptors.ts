import axios from 'axios';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

export function setupAxiosInterceptors(router: Router) {
  axios.interceptors.request.use(async config => {
    const tokenResult = await Preferences.get({ key: 'token' });
    const token = tokenResult.value;
    const isLoginRequest = config.url?.includes('/auth/v1/login');

    if (token && !isLoginRequest) {
      if (isTokenExpired(token)) {
        await handleTokenExpiration(router);
        return Promise.reject(new Error('Token expirado'));
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }, error => {
    return Promise.reject(error);
  });

  axios.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        await handleTokenExpiration(router);
      }
      return Promise.reject(error);
    }
  );
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    return Date.now() >= exp * 1000;
  } catch (e) {
    return true;
  }
}

let isHandlingTokenExpiration = false;

async function handleTokenExpiration(router: Router): Promise<void> {
  if (isHandlingTokenExpiration) return;
  isHandlingTokenExpiration = true;

  await Preferences.remove({ key: 'token' });
  await router.navigate(['']);
  isHandlingTokenExpiration = false;
}

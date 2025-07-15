import axios from 'axios';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

export function setupAxiosInterceptors(router: Router) {
  axios.interceptors.request.use(async config => {
    const url = config.url ?? '';
    const isLogin = url.includes('/auth/v1/login');
    const isRegister = url.includes('/users/v1/create');
    const isConfirmEmail = url.includes('/users/v1/confirm-email');

    // ✅ Permite requisições públicas
    if (isLogin || isRegister || isConfirmEmail) {
      return config;
    }

    const tokenResult = await Preferences.get({ key: 'token' });
    const token = tokenResult.value;

    if (!token) {
      // ❌ Ignora redirecionamento automático aqui
      return config; // <--- NÃO redireciona
    }

    if (isTokenExpired(token)) {
      await Preferences.remove({ key: 'token' });
      router.navigate(['/']);
      return Promise.reject(new Error('Token expirado'));
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  axios.interceptors.response.use(
    response => response,
    async error => {
      // Evita redirecionar em requisições públicas
      const url = error?.config?.url ?? '';
      const isPublic = url.includes('/auth/v1/login') || url.includes('/users/v1/create') || url.includes('/users/v1/confirm-email');

      if (error.response?.status === 401 && !isPublic) {
        await Preferences.remove({ key: 'token' });
        router.navigate(['/']);
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

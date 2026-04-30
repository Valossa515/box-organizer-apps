export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081',
  cognito: {
    // Domínio da Hosted UI (sem barra final). Ex.: 'boxorganizer.auth.us-east-1.amazoncognito.com'
    domain: 'boxorganizer-dev.auth.us-east-1.amazoncognito.com',
    clientId: 'boxorganizer-web',
    redirectUri: 'http://localhost:4200/auth/callback',
    logoutUri: 'http://localhost:4200/',
    scope: 'openid email profile'
  }
};
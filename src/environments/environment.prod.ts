export const environment = {
  production: true,
  apiUrl: 'https://api.boxorganizer.example.com',
  cognito: {
    domain: 'boxorganizer.auth.us-east-1.amazoncognito.com',
    clientId: 'boxorganizer-web',
    redirectUri: 'https://app.boxorganizer.example.com/auth/callback',
    logoutUri: 'https://app.boxorganizer.example.com/',
    scope: 'openid email profile'
  }
};
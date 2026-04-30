export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081',
  cognito: {
    domain: 'boxorganizer-prod-b74e1a70.auth.us-east-1.amazoncognito.com',
    clientId: '3obi6so9l80jn4nls2j81vsmja',
    redirectUri: 'http://localhost:4200/auth/callback',
    logoutUri: 'http://localhost:4200/',
    scope: 'openid email profile'
  }
};
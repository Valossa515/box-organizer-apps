export const environment = {
  production: true,
  // CloudFront na frente do EC2 boxorganizer-prod (HTTPS)
  apiUrl: 'https://dllysr52rho4t.cloudfront.net',
  cognito: {
    domain: 'boxorganizer-prod-b74e1a70.auth.us-east-1.amazoncognito.com',
    clientId: '3obi6so9l80jn4nls2j81vsmja',
    redirectUri: 'https://www.littleboxorganizer.com/auth/callback',
    logoutUri: 'https://www.littleboxorganizer.com/',
    scope: 'openid email profile'
  }
};
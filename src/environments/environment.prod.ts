export const environment = {
  production: true,
  // CloudFront na frente do EC2 boxorganizer-prod (HTTPS)
  apiUrl: 'https://dllysr52rho4t.cloudfront.net',
  cognito: {
    domain: 'boxorganizer-prod-b74e1a70.auth.us-east-1.amazoncognito.com',
    clientId: '3obi6so9l80jn4nls2j81vsmja',
    redirectUri: 'https://box-organizer-apps.vercel.app/auth/callback',
    logoutUri: 'https://box-organizer-apps.vercel.app/',
    scope: 'openid email profile'
  }
};
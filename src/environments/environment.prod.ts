export const environment = {
  production: true,
  // CloudFront na frente do EC2 boxorganizer-prod (HTTPS)
  apiUrl: 'https://dllysr52rho4t.cloudfront.net',
  cognito: {
    // TODO: pegar em AWS Console → Cognito → boxorganizer-prod → App integration → Domain → "Cognito domain"
    // Formato: boxorganizer-prod-XXXXXXXX.auth.us-east-1.amazoncognito.com (sem https://)
    domain: 'REPLACE_ME.auth.us-east-1.amazoncognito.com',
    // TODO: pegar em AWS Console → Cognito → boxorganizer-prod → App integration → App client list → boxorganizer-prod-mobile → Client ID
    // (use o client "mobile" — sem secret — porque SPA/PKCE não pode armazenar client secret)
    clientId: 'REPLACE_ME',
    redirectUri: 'https://box-organizer-apps.vercel.app/auth/callback',
    logoutUri: 'https://box-organizer-apps.vercel.app/',
    scope: 'openid email profile'
  }
};
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mmo515.boxorganizer',
  appName: 'Box Organizer',
  webDir: 'dist/box-organizer-apps',
  android: {
    // Define explicitamente o scheme da WebView (default é https no Capacitor 7).
    androidScheme: 'https',
    // Permite ver logs/devtools em builds de debug.
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      // Splash controlado manualmente: mantém até o app pronto e então esconde via JS.
      launchShowDuration: 2000,
      launchAutoHide: false,
      backgroundColor: '#1976d2',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      // Cor inicial; estilo (dark/light) é aplicado em runtime no AppComponent.
      backgroundColor: '#1976d2',
      style: 'DARK',
      overlaysWebView: false
    },
    Keyboard: {
      // 'native' faz o Android redimensionar a webview ao abrir o teclado,
      // evitando que inputs/FABs fiquem cobertos.
      resize: 'native',
      style: 'DEFAULT',
      resizeOnFullScreen: true
    }
  }
};

export default config;

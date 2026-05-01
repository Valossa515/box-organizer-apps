// app.component.ts
import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DeleteAccountModalComponent } from './pages/account/delete-account-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  // Rotas em que o botão físico "voltar" do Android deve sair do app
  // em vez de navegar para o histórico anterior.
  private readonly rootRoutes = ['/', '/home'];

  // Rotas onde a toolbar global do app shell deve aparecer.
  // Em /items/:boxId a página tem header próprio com back/título, então evitamos barra dupla.
  private readonly toolbarRoutes = [/^\/home(?:$|\?)/];

  showToolbar = false;

  private backButtonHandle?: PluginListenerHandle;
  private routerSub?: Subscription;
  private onlineHandler?: () => void;
  private offlineHandler?: () => void;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    this.initializeApp();
  }

  ngOnInit(): void {
    // Atualiza visibilidade da toolbar a cada navegação.
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.showToolbar = this.toolbarRoutes.some(rx => rx.test(this.router.url));
      });

    // Monitora conexão de rede (browser API — funciona também na webview Android).
    this.registerNetworkListeners();
  }

  private registerNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    this.offlineHandler = () => {
      this.zone.run(() => {
        this.snackBar.open('Você está offline. Algumas ações podem não funcionar.', 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['app-snackbar-warn']
        });
      });
    };
    this.onlineHandler = () => {
      this.zone.run(() => {
        this.snackBar.open('Conexão restabelecida.', 'OK', {
          duration: 2500,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      });
    };

    window.addEventListener('offline', this.offlineHandler);
    window.addEventListener('online', this.onlineHandler);
  }

  async initializeApp() {
    // 1) Auth boot (mantido)
    const currentUrl = this.router.url;
    const publicRoutes = ['/', '/auth/callback'];
    const isPublicRoute = publicRoutes.some(route => currentUrl === route || currentUrl.startsWith(route));

    const isLogged = await this.authService.isAuthenticated();

    if (isLogged && isPublicRoute && !currentUrl.startsWith('/auth/callback')) {
      this.router.navigate(['/home'], { replaceUrl: true });
    }

    // 2) Inicialização de plugins nativos só quando rodando no APK.
    if (Capacitor.isNativePlatform()) {
      await this.setupNativeUi();
      this.registerHardwareBackButton();
      this.registerOAuthDeepLink();
    }
  }

  private registerOAuthDeepLink(): void {
    // Quando o Cognito redireciona para com.mmo515.boxorganizer://auth/callback?code=...
    // o Android dispara appUrlOpen — mapeamos para a rota /auth/callback do Angular.
    CapacitorApp.addListener('appUrlOpen', event => {
      try {
        const url = new URL(event.url);
        if (url.host === 'auth' && url.pathname.startsWith('/callback')) {
          const queryString = url.search ? url.search : '';
          this.zone.run(() => {
            this.router.navigateByUrl(`/auth/callback${queryString}`);
          });
        }
      } catch {
        /* URL inválida — ignora. */
      }
    });
  }

  private async setupNativeUi(): Promise<void> {
    try {
      // Status bar adapta-se ao tema do SO (dark/light).
      const prefersDark = typeof window !== 'undefined'
        && window.matchMedia('(prefers-color-scheme: dark)').matches;

      await StatusBar.setStyle({ style: prefersDark ? Style.Light : Style.Dark });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: prefersDark ? '#121212' : '#1565c0' });
        // overlaysWebView=false: a webview não ocupa a área da status bar.
        // Mantemos false para preservar o comportamento atual; o conteúdo já
        // respeita safe-area via env(safe-area-inset-*).
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Garante que o teclado não sobreponha inputs.
        Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => undefined);
      }
    } catch {
      /* StatusBar pode falhar em alguns devices; não é crítico. */
    }

    // Splash escondida após o app montar; pequeno atraso evita flash branco.
    setTimeout(() => {
      SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);
    }, 300);
  }

  private registerHardwareBackButton(): void {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // Roda dentro do NgZone para que o Router/Angular reajam corretamente.
      this.zone.run(() => {
        const url = this.router.url.split('?')[0];
        const isRoot = this.rootRoutes.includes(url);

        if (isRoot || !canGoBack) {
          CapacitorApp.exitApp();
          return;
        }
        // Navegação nativa de histórico (suporta predictive back).
        history.back();
      });
    }).then(handle => (this.backButtonHandle = handle));
  }

  ngOnDestroy(): void {
    this.backButtonHandle?.remove();
    this.routerSub?.unsubscribe();
    if (typeof window !== 'undefined') {
      if (this.onlineHandler) window.removeEventListener('online', this.onlineHandler);
      if (this.offlineHandler) window.removeEventListener('offline', this.offlineHandler);
    }
  }

  // ----- Toolbar actions -----

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  openDeleteAccount(): void {
    this.dialog.open(DeleteAccountModalComponent, {
      disableClose: true,
      // Responsivo: ocupa 95% da viewport em phones, com cap em 440 px no desktop.
      width: '95vw',
      maxWidth: '440px',
      autoFocus: 'first-tabbable'
    });
  }
}

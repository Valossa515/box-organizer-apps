import { setupAxiosInterceptors } from './app/core/setupAxiosInterceptors';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { bootstrapApplication } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    // Install axios interceptors before any route guard runs. Without this,
    // a direct navigation to a protected route (e.g. /home) on first load
    // would trigger guards (AuthGuard → ConsentGuard) before the Bearer
    // header is attached, causing spurious 401s and redirects to /login
    // even for users with a valid stored token.
    provideAppInitializer(() => {
      const router = inject(Router);
      setupAxiosInterceptors(router);
    }),
    importProvidersFrom(
      MatSnackBarModule,
      MatProgressSpinnerModule,
      MatCardModule,
      MatIconModule,
      MatDialogModule
    )
  ]
};

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
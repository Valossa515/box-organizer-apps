import { setupAxiosInterceptors } from './app/core/setupAxiosInterceptors';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // <--- Adicione esta linha
import { MatCardModule } from '@angular/material/card'; // <--- Adicione esta linha (você usa mat-card)
import { MatIconModule } from '@angular/material/icon'; // <--- Adicione esta linha (você usa mat-icon)
import { bootstrapApplication } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      MatSnackBarModule,
      MatProgressSpinnerModule,
      MatCardModule,
      MatIconModule
    )
  ]
};

bootstrapApplication(AppComponent, appConfig).then(appRef => {
  const router = appRef.injector.get(Router);
  setupAxiosInterceptors(router);
}).catch(err => console.error(err));
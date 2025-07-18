// app.component.ts
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    const currentUrl = this.router.url;

    // Se já está logado, redireciona para /home, exceto se já estiver em rota protegida
    const isLogged = await this.authService.isAuthenticated();

    if (isLogged) {
      const isAlreadyInProtectedRoute = !['/', '/register', '/confirm-email'].some(route =>
        currentUrl.startsWith(route)
      );

      if (!isAlreadyInProtectedRoute) {
        this.router.navigate(['/home'], { replaceUrl: true });
      }

      return;
    }

    const isPublicRoute = ['/', '/register', '/confirm-email'].some(route =>
      currentUrl.startsWith(route)
    );

    if (isLogged && !isPublicRoute) {
      return;
    }

    if (isLogged && isPublicRoute) {
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }
  }
}

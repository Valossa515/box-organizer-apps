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

    // Rotas públicas que não precisam redirecionamento
    const publicRoutes = ['/', '/register', '/confirm-email'];

    // ⚠️ Verifica se a URL atual é pública
    const isPublic = publicRoutes.some(route => currentUrl.startsWith(route));

    if (isPublic) {
      return; // ✅ Deixa o Angular seguir normalmente
    }

    const isLogged = await this.authService.isAuthenticated();

    if (isLogged) {
      this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      this.router.navigate([''], { replaceUrl: true });
    }
  }
}

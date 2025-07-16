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
    const publicRoutes = ['/', '/register', '/confirm-email'];
    const currentUrl = this.router.url;
    const isPublic = publicRoutes.some(route => currentUrl.startsWith(route));

    if (isPublic) {
      // ✅ Rota pública: não redireciona nunca
      return;
    }

    const isLogged = await this.authService.isAuthenticated();

    if (isLogged) {
      // ✅ Logado e em rota protegida: tudo certo
      return;
    }

    // ❌ Não logado e em rota protegida — redireciona para login
    this.router.navigate(['/'], { replaceUrl: true });
  }
}

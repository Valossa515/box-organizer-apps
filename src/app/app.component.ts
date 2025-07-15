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
    const isLogged = await this.authService.isAuthenticated();

    const publicRoutes = ['/', '/register', '/confirm-email'];
    const currentUrl = this.router.url;
    const isPublic = publicRoutes.some(route => currentUrl.startsWith(route));

    if (isLogged && !isPublic) {
      // ✅ Usuário está logado e já em rota protegida — não redireciona
      return;
    }

    if (isLogged) {
      // ✅ Logado, mas em rota pública — redireciona para home
      this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      // ❌ Não logado — redireciona para login
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }
}

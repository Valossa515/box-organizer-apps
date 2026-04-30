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
    const publicRoutes = ['/', '/auth/callback'];
    const isPublicRoute = publicRoutes.some(route => currentUrl === route || currentUrl.startsWith(route));

    const isLogged = await this.authService.isAuthenticated();

    if (isLogged && isPublicRoute && !currentUrl.startsWith('/auth/callback')) {
      this.router.navigate(['/home'], { replaceUrl: true });
    }
  }
}

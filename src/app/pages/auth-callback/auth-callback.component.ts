import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <ng-container *ngIf="!error">
        <p>Autenticando...</p>
        <mat-spinner diameter="48" strokeWidth="4"></mat-spinner>
      </ng-container>
      <ng-container *ngIf="error">
        <h3>Falha no login</h3>
        <p>{{ error }}</p>
      </ng-container>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      min-height: 60vh;
      min-height: 60dvh;
      padding:
        calc(1rem + var(--safe-area-top))
        calc(1rem + var(--safe-area-right))
        calc(1rem + var(--safe-area-bottom))
        calc(1rem + var(--safe-area-left));
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    const cognitoError = this.route.snapshot.queryParamMap.get('error_description')
      ?? this.route.snapshot.queryParamMap.get('error');

    if (cognitoError) {
      this.error = cognitoError;
      return;
    }
    if (!code || !state) {
      this.error = 'Parâmetros ausentes no retorno do Cognito.';
      return;
    }

    try {
      await this.authService.handleCallback(code, state);
      await this.router.navigate(['/home'], { replaceUrl: true });
    } catch (err: any) {
      this.error = err?.message ?? 'Erro ao processar autenticação';
    }
  }
}

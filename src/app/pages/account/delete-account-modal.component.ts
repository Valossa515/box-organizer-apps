import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountService } from '../../../services/account.service';
import { AuthService } from '../../../services/auth.service';

const CONFIRMATION_WORD = 'EXCLUIR';

@Component({
  selector: 'app-delete-account-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Excluir minha conta</h2>
    <mat-dialog-content>
      <p class="warning-text">
        Esta ação é <strong>irreversível</strong>. Todos os seus dados (caixas, itens, imagens e
        consentimentos) serão permanentemente apagados conforme a LGPD.
      </p>
      <p>Digite <strong>{{ confirmationWord }}</strong> abaixo para confirmar:</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Confirmação</mat-label>
        <input matInput [(ngModel)]="typed" autocomplete="off" />
      </mat-form-field>
      @if (error) {
        <p class="error-text">{{ error }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="loading">Cancelar</button>
      <button
        mat-flat-button
        color="warn"
        [disabled]="typed !== confirmationWord || loading"
        (click)="confirm()"
      >
        @if (loading) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Excluir permanentemente
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-text { color: #d32f2f; }
    .error-text { color: #d32f2f; font-size: 0.85em; }
    .full-width { width: 100%; }
    mat-dialog-content { max-width: 400px; }
  `]
})
export class DeleteAccountModalComponent {
  readonly confirmationWord = CONFIRMATION_WORD;
  typed = '';
  loading = false;
  error = '';

  constructor(
    private dialogRef: MatDialogRef<DeleteAccountModalComponent>,
    private accountService: AccountService,
    private authService: AuthService
  ) {}

  async confirm(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.accountService.deleteAccount();
      this.dialogRef.close(true);
      await this.authService.logout();
    } catch (err: any) {
      this.error = err?.response?.data?.error ?? 'Falha ao excluir conta. Tente novamente.';
      this.loading = false;
    }
  }
}

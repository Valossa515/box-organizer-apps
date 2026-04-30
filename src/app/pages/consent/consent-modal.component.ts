import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsentService } from '../../../services/consent.service';
import { PendingConsent } from '../../models/consent.model';

interface DialogData {
  pending: PendingConsent[];
}

/**
 * Modal bloqueante exibido após login quando o usuário tem documentos legais
 * pendentes de aceite. Cada documento exige um checkbox marcado; o botão
 * "Continuar" só é habilitado quando todos estão marcados. Ao confirmar,
 * envia um POST por documento e fecha com `true` em caso de sucesso total.
 */
@Component({
  selector: 'app-consent-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Antes de continuar</h2>
    <mat-dialog-content>
      <p class="intro">
        Para usar o BoxOrganizer você precisa concordar com os documentos abaixo.
        Eles definem como tratamos seus dados em conformidade com a LGPD.
      </p>

      <div class="doc" *ngFor="let doc of data.pending; let i = index">
        <a [href]="doc.url" target="_blank" rel="noopener noreferrer" class="doc-link">
          {{ doc.title }} <span class="version">({{ doc.version }})</span>
        </a>
        <mat-checkbox [(ngModel)]="accepted[i]" [disabled]="submitting">
          Li e aceito o documento acima
        </mat-checkbox>
      </div>

      <p class="error" *ngIf="error">{{ error }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <mat-spinner *ngIf="submitting" diameter="24" strokeWidth="3"></mat-spinner>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!allAccepted || submitting"
        (click)="confirm()">
        Continuar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; min-width: 320px; max-width: 520px; }
    .intro { color: #4b5563; margin-bottom: 1rem; }
    .doc {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 0;
      border-top: 1px solid #e5e7eb;
    }
    .doc:last-of-type { border-bottom: 1px solid #e5e7eb; margin-bottom: 1rem; }
    .doc-link { color: #7c3aed; font-weight: 500; text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
    .version { color: #9ca3af; font-weight: 400; font-size: 0.85rem; }
    .error { color: #b91c1c; margin-top: 0.75rem; }
    mat-dialog-actions { gap: 12px; }
  `]
})
export class ConsentModalComponent {

  accepted: boolean[];
  submitting = false;
  error = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialogRef: MatDialogRef<ConsentModalComponent, boolean>,
    private consents: ConsentService
  ) {
    this.accepted = data.pending.map(() => false);
    this.dialogRef.disableClose = true;
  }

  get allAccepted(): boolean {
    return this.accepted.length > 0 && this.accepted.every(v => v);
  }

  async confirm(): Promise<void> {
    if (!this.allAccepted || this.submitting) return;
    this.submitting = true;
    this.error = '';
    try {
      for (const doc of this.data.pending) {
        await this.consents.accept({
          documentType: doc.documentType,
          version: doc.version
        });
      }
      this.dialogRef.close(true);
    } catch (err: any) {
      this.error = err?.message ?? 'Falha ao registrar aceite. Tente novamente.';
      this.submitting = false;
    }
  }
}

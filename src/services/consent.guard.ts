import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConsentService } from './consent.service';
import { ConsentModalComponent } from '../app/pages/consent/consent-modal.component';

/**
 * Guard que garante que o usuário aceitou todos os documentos legais
 * vigentes antes de acessar rotas internas. Deve rodar APÓS o `AuthGuard`.
 *
 * Comportamento:
 *  - Sem pendências → libera (true)
 *  - Com pendências → abre modal bloqueante; libera apenas após aceite total
 *  - Falha ao consultar → bloqueia e redireciona ao login
 */
@Injectable({ providedIn: 'root' })
export class ConsentGuard implements CanActivate {
  constructor(
    private consents: ConsentService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const pending = await this.consents.getRequired();
      if (pending.length === 0) return true;

      const accepted = await this.dialog
        .open(ConsentModalComponent, {
          data: { pending },
          disableClose: true,
          width: '520px',
          maxWidth: '95vw'
        })
        .afterClosed()
        .toPromise();

      if (accepted) return true;
      this.router.navigate(['']);
      return false;
    } catch {
      this.router.navigate(['']);
      return false;
    }
  }
}

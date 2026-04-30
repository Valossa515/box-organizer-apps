import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BoxesComponent } from '../boxes/boxes.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
import { DeleteAccountModalComponent } from '../account/delete-account-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BoxesComponent, MatIconModule, MatDialogModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  openDeleteAccount(): void {
    this.dialog.open(DeleteAccountModalComponent, {
      disableClose: true,
      width: '440px'
    });
  }
}

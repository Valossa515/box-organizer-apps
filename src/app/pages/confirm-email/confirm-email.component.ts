import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import axios from 'axios';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-email',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.scss'
})
export class ConfirmEmailComponent implements OnInit {

  message = 'Confirmando seu e-mail...';
  success = false;
  loading = true;

   constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!userId || !token) {
      this.message = 'Parâmetros inválidos.';
      this.loading = false;
      return;
    }

    try {
      const url = `${environment.apiUrl}/users/v1/confirm-email?userId=${userId}&token=${encodeURIComponent(token)}`;
      const response = await axios.get(url);

      this.message = response.data;
      this.success = true;

    } catch (error: any) {
      console.error(error);
      this.message = error?.response?.data?.[0]?.description || 'Erro ao confirmar o e-mail.';
    }
    finally {
      this.loading = false;
    }
  }
}

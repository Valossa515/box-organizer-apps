import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoginForm } from '../../models/login-form.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCardModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form: LoginForm = {
    email: '',
    password: '',
    loading: false,
    error: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  async login(event: Event) {
    event.preventDefault();
    this.form.loading = true;
    this.form.error = '';

    const result = await this.authService.login({
      email: this.form.email,
      password: this.form.password
    });

    if (result.success) {
      this.router.navigateByUrl('/home');
    } else {
      this.form.error = result.error || 'Erro desconhecido';
    }

    this.form.loading = false;
  }

  async register() {
    this.router.navigateByUrl('/register');
  }
}
import { UserService } from './../../../services/user.service';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CreateUserRequest } from '../../models/register-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    loading: false,
    error: ''
  };

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private router: Router
  ) { }

  register() {
    this.form.error = '';

    if (!this.form.name || this.form.name.trim().length === 0) {
      this.form.error = 'Digite seu nome de usuário.';
      return;
    }

    const usernameRegex = /^[A-Za-z0-9]+$/;
    if (!usernameRegex.test(this.form.name)) {
      this.form.error = 'Nome de usuário inválido. Use apenas letras e números, sem espaços.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.form.email)) {
      this.form.error = 'Digite um e-mail válido.';
      return;
    }

    if (this.form.password !== this.form.confirmPassword) {
      this.form.error = 'As senhas não coincidem.';
      return;
    }

    const payload: CreateUserRequest = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      confirmPassword: this.form.confirmPassword
    };

    this.form.loading = true;

    this.userService.createUser(payload)
      .then(() => {
        this.form.loading = false;
        this.router.navigate(['']); // Redireciona se sucesso
      })
      .catch(() => {
        this.form.loading = false;
        this.form.error = 'Nome inválido ou já está em uso. Por favor, tente outro.';
      });
  }
}
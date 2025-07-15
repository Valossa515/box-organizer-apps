import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from '../services/auth.guard';  

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [AuthGuard] },
  { path: 'items/:boxId', loadComponent: () => import('./pages/items/items.component').then(m => m.ItemsComponent), canActivate: [AuthGuard] },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'confirm-email', loadComponent: () => import('./pages/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent) }
];
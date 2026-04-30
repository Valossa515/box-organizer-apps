import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from '../services/auth.guard';
import { ConsentGuard } from '../services/consent.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard, ConsentGuard]
  },
  {
    path: 'items/:boxId',
    loadComponent: () => import('./pages/items/items.component').then(m => m.ItemsComponent),
    canActivate: [AuthGuard, ConsentGuard]
  },
  { path: '**', redirectTo: '' }
];
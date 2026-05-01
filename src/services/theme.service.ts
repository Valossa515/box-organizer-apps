import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'app.theme';

/**
 * Gerencia o tema (claro/escuro/sistema). O modo escolhido é persistido em
 * localStorage e aplicado de duas formas no <html>:
 *  - atributo `data-theme` (para hooks/CSS condicional)
 *  - estilo inline `color-scheme` (fonte de verdade lida pelos tokens
 *    Material 3 via `light-dark()` e pelo user-agent para form controls).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Modo escolhido pelo usuário. */
  readonly mode = signal<ThemeMode>('system');
  /** Tema efetivamente aplicado (resolve `system` para light/dark). */
  readonly resolved = signal<ResolvedTheme>('light');

  private mediaQuery?: MediaQueryList;

  init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system';
    this.mode.set(stored);

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => this.apply());

    this.apply();
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    this.apply();
  }

  /** Cicla entre system → light → dark → system. */
  cycle(): void {
    const next: ThemeMode =
      this.mode() === 'system' ? 'light' : this.mode() === 'light' ? 'dark' : 'system';
    this.setMode(next);
  }

  private apply(): void {
    const mode = this.mode();
    const resolved: ResolvedTheme =
      mode === 'system'
        ? this.mediaQuery?.matches ? 'dark' : 'light'
        : mode;

    this.resolved.set(resolved);

    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    // `color-scheme` inline garante que tokens Material 3 (light-dark())
    // troquem instantaneamente, mesmo quando o usuário força um modo
    // diferente do prefers-color-scheme do SO.
    root.style.colorScheme = resolved;
  }
}

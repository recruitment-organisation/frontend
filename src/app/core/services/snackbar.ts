import { Injectable, signal } from '@angular/core';

export type SnackbarKind = 'success' | 'error' | 'info';

export interface SnackbarMessage {
  text: string;
  kind: SnackbarKind;
}

@Injectable({ providedIn: 'root' })
export class Snackbar {
  readonly current = signal<SnackbarMessage | null>(null);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  show(text: string, kind: SnackbarKind = 'success', duration = 3000): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.current.set({ text, kind });
    this.timeoutId = setTimeout(() => this.dismiss(), duration);
  }

  success(text: string): void { this.show(text, 'success'); }
  error(text: string): void { this.show(text, 'error'); }
  dismiss(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
    this.current.set(null);
  }
}

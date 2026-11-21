import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class Toasts {
  private seq = 0;
  readonly list = signal<Toast[]>([]);

  show(kind: ToastKind, title: string, detail?: string): void {
    const id = ++this.seq;
    this.list.update((l) => [...l.slice(-3), { id, kind, title, detail }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 7000 : 4500);
  }

  dismiss(id: number): void {
    this.list.update((l) => l.filter((t) => t.id !== id));
  }
}

import { Injectable, signal } from '@angular/core';
import type { Personne } from '../gen/personne_pb';

export type PageId = 'annuaire' | 'recherche' | 'labo';
const PAGES: PageId[] = ['annuaire', 'recherche', 'labo'];

@Injectable({ providedIn: 'root' })
export class Ui {
  readonly page = signal<PageId>(this.fromHash());
  readonly editor = signal<{ open: boolean; personne: Personne | null }>({ open: false, personne: null });
  readonly toDelete = signal<Personne | null>(null);

  constructor() {
    window.addEventListener('hashchange', () => this.page.set(this.fromHash()));
  }

  go(p: PageId): void {
    location.hash = `#/${p}`;
    this.page.set(p);
    window.scrollTo({ top: 0 });
  }

  openCreate(): void {
    this.editor.set({ open: true, personne: null });
  }

  openEdit(p: Personne): void {
    this.editor.set({ open: true, personne: p });
  }

  closeEditor(): void {
    this.editor.update((e) => ({ ...e, open: false }));
  }

  private fromHash(): PageId {
    const h = location.hash.replace('#/', '') as PageId;
    return PAGES.includes(h) ? h : 'annuaire';
  }
}

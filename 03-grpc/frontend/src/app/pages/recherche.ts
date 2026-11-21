import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Avatar } from '../components/avatar';
import { calls, hex } from '../core/grpc';
import { ageOf, formatDate, formatPhone, fullName } from '../core/format';
import { PersonnesStore } from '../core/personnes.store';
import { Ui } from '../core/ui';
import type { Personne } from '../gen/personne_pb';

type Result = { state: 'idle' } | { state: 'found'; p: Personne } | { state: 'missing'; id: string };

@Component({
  selector: 'app-recherche',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recherche.html',
})
export class RecherchePage {
  protected readonly store = inject(PersonnesStore);
  protected readonly ui = inject(Ui);
  protected readonly value = signal('');
  protected readonly busy = signal(false);
  protected readonly result = signal<Result>({ state: 'idle' });
  private readonly searched = signal(false);

  protected readonly shortcuts = computed(() =>
    [...this.store.personnes()].sort((a, b) => Number(a.id - b.id)).slice(0, 8),
  );
  protected readonly last = computed(() =>
    this.searched() ? calls().find((c) => c.method === 'Rechercher') : undefined,
  );

  protected onInput(e: Event): void {
    this.value.set((e.target as HTMLInputElement).value.replace(/\D/g, ''));
  }

  async run(id: bigint | string): Promise<void> {
    const text = String(id).replace(/\D/g, '');
    if (!text || BigInt(text) <= 0n) return;
    this.value.set(text);
    this.busy.set(true);
    try {
      const p = await this.store.rechercher(BigInt(text));
      this.result.set(p ? { state: 'found', p } : { state: 'missing', id: text });
    } catch {
      this.result.set({ state: 'idle' });
    } finally {
      this.busy.set(false);
      this.searched.set(true);
    }
  }

  protected name = fullName;
  protected date = formatDate;
  protected phone = formatPhone;
  protected age = ageOf;
  protected hex = hex;
}

/**
 * État de l'annuaire. La liste est chargée par Lister(), puis tenue à jour
 * EN DIRECT par le flux Suivre() (streaming serveur) : une personne ajoutée
 * depuis Postman ou un autre navigateur apparaît sans recharger.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { Code, ConnectError } from '@connectrpc/connect';
import { create } from '@bufbuild/protobuf';
import {
  AjouterRequestSchema,
  EvenementPersonne_Type,
  ModifierRequestSchema,
  type EvenementPersonne,
  type Personne,
} from '../gen/personne_pb';
import { client, describeError, isUnavailable } from './grpc';
import { fullName, type PersonneForm } from './format';
import { Toasts } from './toasts';

export type StreamState = 'connecting' | 'open' | 'retrying' | 'closed';

export interface LiveEvent {
  key: number;
  type: 'AJOUT' | 'MODIFICATION' | 'SUPPRESSION';
  personne: Personne;
  at: string;
}

@Injectable({ providedIn: 'root' })
export class PersonnesStore {
  private toasts = inject(Toasts);

  readonly personnes = signal<Personne[]>([]);
  readonly loading = signal(true);
  readonly online = signal<boolean | null>(null);
  readonly lastSync = signal<Date | null>(null);

  readonly stream = signal<StreamState>('connecting');
  readonly events = signal<LiveEvent[]>([]);
  /** id → type du dernier événement (pour faire « flasher » la carte) */
  readonly highlights = signal<Map<string, LiveEvent['type']>>(new Map());

  readonly total = computed(() => this.personnes().length);

  private eventSeq = 0;
  private abort?: AbortController;
  private retryDelay = 1000;

  constructor() {
    void this.refresh();
    void this.follow();
  }

  /* ---------------- Appels unaires ---------------- */

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await client.lister({});
      this.personnes.set(res.personnes);
      this.online.set(true);
      this.lastSync.set(new Date());
    } catch (e) {
      if (isUnavailable(e)) this.online.set(false);
      else this.toasts.show('error', 'Lister() a échoué', describeError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async ajouter(form: PersonneForm): Promise<Personne> {
    try {
      const p = await client.ajouter(create(AjouterRequestSchema, form));
      this.upsert(p);
      this.toasts.show('success', `${fullName(p)} a été ajouté(e)`, `Ajouter() → Personne { id: ${p.id} }`);
      return p;
    } catch (e) {
      this.fail('Ajout impossible', e);
      throw e;
    }
  }

  async modifier(id: bigint, form: PersonneForm): Promise<Personne> {
    try {
      const p = await client.modifier(create(ModifierRequestSchema, { id, ...form }));
      this.upsert(p);
      this.toasts.show('success', 'Fiche mise à jour', `Modifier({ id: ${id} }) → OK`);
      return p;
    } catch (e) {
      this.fail('Modification impossible', e);
      throw e;
    }
  }

  async supprimer(p: Personne): Promise<void> {
    try {
      await client.supprimer({ id: p.id });
      this.personnes.update((l) => l.filter((x) => x.id !== p.id));
      this.toasts.show('success', `${fullName(p)} a été supprimé(e)`, `Supprimer({ id: ${p.id} }) → { supprime: true }`);
    } catch (e) {
      this.fail('Suppression impossible', e);
      throw e;
    }
  }

  /** null si le serveur répond NOT_FOUND */
  async rechercher(id: bigint): Promise<Personne | null> {
    try {
      return await client.rechercher({ id });
    } catch (e) {
      if (ConnectError.from(e).code === Code.NotFound) return null;
      this.fail('Recherche impossible', e);
      throw e;
    }
  }

  /* ---------------- Streaming serveur : Suivre() ---------------- */

  private async follow(): Promise<void> {
    this.abort = new AbortController();
    this.stream.set(this.stream() === 'open' ? 'retrying' : this.stream());
    try {
      const flux = client.suivre(
        {},
        {
          signal: this.abort.signal,
          // en-têtes reçus = le flux est ouvert côté serveur
          onHeader: () => {
            this.stream.set('open');
            this.retryDelay = 1000;
            if (this.online() === false) void this.refresh();
          },
        },
      );
      for await (const ev of flux) this.apply(ev);
    } catch {
      if (this.abort.signal.aborted) return;
    }
    // flux terminé ou coupé : on se reconnecte avec un délai croissant
    this.stream.set('retrying');
    setTimeout(() => void this.follow(), this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 15000);
  }

  private apply(ev: EvenementPersonne): void {
    if (ev.type === EvenementPersonne_Type.ABONNEMENT) {
      // premier message du flux : l'abonnement est confirmé par le serveur
      this.stream.set('open');
      this.retryDelay = 1000;
      if (this.online() === false) void this.refresh();
      return;
    }
    if (!ev.personne) return;
    const type = EvenementPersonne_Type[ev.type] as LiveEvent['type'];
    const p = ev.personne;
    if (type === 'SUPPRESSION') this.personnes.update((l) => l.filter((x) => x.id !== p.id));
    else this.upsert(p);

    this.events.update((l) => [{ key: ++this.eventSeq, type, personne: p, at: ev.horodatage }, ...l].slice(0, 40));
    const key = p.id.toString();
    this.highlights.update((m) => new Map(m).set(key, type));
    setTimeout(() => {
      this.highlights.update((m) => {
        const n = new Map(m);
        n.delete(key);
        return n;
      });
    }, 2200);
    this.lastSync.set(new Date());
  }

  private upsert(p: Personne): void {
    this.personnes.update((l) => {
      const i = l.findIndex((x) => x.id === p.id);
      if (i === -1) return [...l, p];
      const copy = [...l];
      copy[i] = p;
      return copy;
    });
  }

  private fail(title: string, e: unknown): void {
    if (isUnavailable(e)) this.online.set(false);
    this.toasts.show('error', title, describeError(e));
  }
}

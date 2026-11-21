import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { fromJsonString, type DescMethodUnary } from '@bufbuild/protobuf';
import { calls, changeServerUrl, client, frameHeader, hex, serverUrl, wire, type CallRecord } from '../core/grpc';
import { formatTime } from '../core/format';
import { PersonnesStore } from '../core/personnes.store';
import { PersonneService } from '../gen/personne_pb';

interface Example {
  name: 'ajouter' | 'lister' | 'rechercher' | 'modifier' | 'supprimer';
  label: string;
  body: (id: string) => object;
  error?: boolean;
}

/**
 * Laboratoire : envoyer un message à la main et regarder ce qui passe « sur le fil ».
 * Montre la différence de taille entre JSON et Protobuf et la trame gRPC-Web.
 */
@Component({
  selector: 'app-labo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './labo.html',
})
export class LaboPage {
  private readonly store = inject(PersonnesStore);

  protected readonly examples: Example[] = [
    { name: 'ajouter', label: 'Ajouter', body: () => ({ nom: 'DIOP', prenom: 'Amadou', dateNaissance: '2000-05-15', adresse: 'Ziguinchor', telephone: '771234567' }) },
    { name: 'lister', label: 'Lister', body: () => ({}) },
    { name: 'rechercher', label: 'Rechercher', body: (id) => ({ id }) },
    { name: 'modifier', label: 'Modifier', body: (id) => ({ id, nom: 'DIOP', prenom: 'Amadou', dateNaissance: '2000-05-15', adresse: 'Dakar', telephone: '779876543' }) },
    { name: 'supprimer', label: 'Supprimer', body: (id) => ({ id }) },
    { name: 'rechercher', label: 'NOT_FOUND', body: () => ({ id: '9999' }), error: true },
    { name: 'ajouter', label: 'INVALID_ARGUMENT', body: () => ({ nom: 'FALL', prenom: 'Awa', dateNaissance: '15/05/2000', adresse: 'Thiès', telephone: '781112233' }), error: true },
  ];

  protected readonly method = signal<Example['name']>('lister');
  protected readonly source = signal('{}');
  protected readonly parseError = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly selected = signal<number | null>(null);
  protected readonly url = signal(serverUrl);

  protected readonly calls = calls;
  protected readonly current = computed<CallRecord | undefined>(() => {
    const id = this.selected();
    return id === null ? calls()[0] : calls().find((c) => c.seq === id);
  });

  protected readonly desc = computed(() => PersonneService.method[this.method()] as DescMethodUnary);
  protected readonly signature = computed(() => {
    const d = this.desc();
    return `rpc ${d.name}(${d.input.name}) returns (${d.output.name})`;
  });

  constructor() {
    this.load(this.examples[1]);
  }

  protected load(ex: Example): void {
    const id = this.store.personnes()[0]?.id.toString() ?? '1';
    this.method.set(ex.name);
    this.source.set(JSON.stringify(ex.body(id), null, 2));
    this.parseError.set(null);
  }

  protected async send(): Promise<void> {
    const d = this.desc();
    let message;
    try {
      // Le JSON saisi est converti en message Protobuf typé (le schéma vient du .proto)
      message = fromJsonString(d.input, this.source());
      this.parseError.set(null);
    } catch (e) {
      this.parseError.set(e instanceof Error ? e.message : String(e));
      return;
    }
    this.sending.set(true);
    try {
      const call = client[this.method()] as (m: unknown) => Promise<unknown>;
      await call(message);
    } catch {
      /* l'erreur est visible dans le journal */
    } finally {
      this.sending.set(false);
      this.selected.set(null);
      if (/ajouter|modifier|supprimer/.test(this.method())) void this.store.refresh();
    }
  }

  protected onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void this.send();
    }
  }

  protected applyUrl(): void {
    changeServerUrl(this.url());
  }

  protected gain(c: CallRecord, which: 'request' | 'response'): number {
    const w = which === 'request' ? c.request : c.response;
    if (!w || !w.jsonBytes) return 0;
    return Math.round((1 - w.protoBytes.length / w.jsonBytes) * 100);
  }

  protected bar(c: CallRecord, which: 'request' | 'response'): number {
    const w = which === 'request' ? c.request : c.response;
    if (!w || !w.jsonBytes) return 0;
    return Math.max(2, Math.round((w.protoBytes.length / w.jsonBytes) * 100));
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected hex = hex;
  protected frameHeader = frameHeader;
  protected time = formatTime;
  protected wire = wire;
}

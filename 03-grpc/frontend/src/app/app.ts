import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ConfirmDialog } from './components/confirm-dialog';
import { FluxPanel } from './components/flux-panel';
import { PersonneDialog } from './components/personne-dialog';
import { ToastStack } from './components/toast-stack';
import { serverUrl } from './core/grpc';
import { PersonnesStore } from './core/personnes.store';
import { Ui, type PageId } from './core/ui';
import { AnnuairePage } from './pages/annuaire';
import { LaboPage } from './pages/labo';
import { RecherchePage } from './pages/recherche';

@Component({
  selector: 'app-root',
  imports: [AnnuairePage, RecherchePage, LaboPage, FluxPanel, PersonneDialog, ConfirmDialog, ToastStack],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly ui = inject(Ui);
  protected readonly store = inject(PersonnesStore);
  protected readonly host = serverUrl.replace(/^https?:\/\//, '');

  protected readonly tabs: { id: PageId; label: string; rpc: string }[] = [
    { id: 'annuaire', label: 'Annuaire', rpc: 'Lister' },
    { id: 'recherche', label: 'Recherche', rpc: 'Rechercher' },
    { id: 'labo', label: 'Laboratoire', rpc: 'Protobuf' },
  ];

  protected readonly status = computed(() => {
    const o = this.store.online();
    return o === null ? 'checking' : o ? 'online' : 'offline';
  });
}

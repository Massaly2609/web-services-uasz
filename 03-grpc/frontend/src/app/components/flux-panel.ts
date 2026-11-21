import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatTime, fullName } from '../core/format';
import { PersonnesStore } from '../core/personnes.store';

/** Panneau « flux en direct » : affiche les messages du streaming serveur Suivre() */
@Component({
  selector: 'app-flux-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="flux" aria-label="Flux Suivre() en direct">
      <header class="flux-head">
        <div>
          <div class="flux-kicker">streaming serveur</div>
          <h2 class="flux-title">rpc Suivre() <span class="flux-arrow">→ stream</span></h2>
        </div>
        <span class="flux-state" [attr.data-state]="store.stream()">
          <i></i>{{ stateLabel() }}
        </span>
      </header>

      <p class="flux-hint">
        Un seul appel, ouvert en permanence : le serveur pousse un message à chaque
        ajout, modification ou suppression — y compris depuis <b>Postman</b>.
      </p>

      <ol class="flux-list">
        @for (e of store.events(); track e.key) {
          <li class="flux-item" [attr.data-type]="e.type">
            <span class="flux-type">{{ e.type }}</span>
            <span class="flux-name">{{ name(e.personne) }}</span>
            <span class="flux-meta">id {{ e.personne.id }} · {{ time(e.at) }}</span>
          </li>
        } @empty {
          <li class="flux-empty">
            <span class="flux-pulse"></span>
            En attente d’un événement…<br />
            <small>Ajoutez une personne ici ou dans Postman.</small>
          </li>
        }
      </ol>

      <footer class="flux-foot">
        <span>{{ store.events().length }} message(s) reçu(s)</span>
        <code>EvenementPersonne</code>
      </footer>
    </aside>
  `,
})
export class FluxPanel {
  protected readonly store = inject(PersonnesStore);
  protected readonly stateLabel = computed(
    () => ({ connecting: 'connexion…', open: 'en écoute', retrying: 'reconnexion…', closed: 'fermé' })[this.store.stream()],
  );
  protected name = fullName;
  protected time = (iso: string) => (iso ? formatTime(iso) : '');
}

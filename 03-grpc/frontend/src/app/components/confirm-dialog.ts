import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { fullName } from '../core/format';
import { PersonnesStore } from '../core/personnes.store';
import { Ui } from '../core/ui';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.toDelete(); as p) {
      <div class="modal-root">
        <div class="scrim" (click)="!busy() && ui.toDelete.set(null)"></div>
        <div class="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <div class="confirm-mark">!</div>
          <h2 id="confirm-title">Supprimer {{ name(p) }} ?</h2>
          <p>
            Appel unaire <code>Supprimer({{ '{' }} id: {{ p.id }} {{ '}' }})</code>. Les clients abonnés à
            <code>Suivre()</code> recevront un événement <b>SUPPRESSION</b>.
          </p>
          <div class="modal-actions">
            <button class="btn ghost" [disabled]="busy()" (click)="ui.toDelete.set(null)">Annuler</button>
            <button class="btn danger" [disabled]="busy()" (click)="confirm()">
              @if (busy()) { <span class="spinner"></span> } Supprimer
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  protected readonly ui = inject(Ui);
  private readonly store = inject(PersonnesStore);
  protected readonly busy = signal(false);
  protected name = fullName;

  async confirm(): Promise<void> {
    const p = this.ui.toDelete();
    if (!p) return;
    this.busy.set(true);
    try {
      await this.store.supprimer(p);
      this.ui.toDelete.set(null);
    } catch {
      /* notification déjà affichée */
    } finally {
      this.busy.set(false);
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (!this.busy()) this.ui.toDelete.set(null);
  }
}

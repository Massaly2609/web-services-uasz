import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Avatar } from '../components/avatar';
import { ageOf, formatDate, formatPhone, formatTime, fullName } from '../core/format';
import { PersonnesStore } from '../core/personnes.store';
import { Ui } from '../core/ui';
import type { Personne } from '../gen/personne_pb';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

@Component({
  selector: 'app-annuaire',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './annuaire.html',
})
export class AnnuairePage {
  protected readonly store = inject(PersonnesStore);
  protected readonly ui = inject(Ui);
  protected readonly query = signal('');
  protected readonly sort = signal<'recent' | 'nom'>('recent');

  protected readonly rows = computed(() => {
    const q = norm(this.query().trim());
    const list = this.store
      .personnes()
      .filter((p) => !q || norm(`${p.nom} ${p.prenom} ${p.adresse} ${p.telephone} ${p.id}`).includes(q));
    return [...list].sort((a, b) =>
      this.sort() === 'nom'
        ? a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr')
        : Number(b.id - a.id),
    );
  });

  protected readonly stats = computed(() => {
    const ps = this.store.personnes();
    const ages = ps.map((p) => ageOf(p.dateNaissance)).filter((a): a is number => a !== null);
    const villes = new Set(ps.map((p) => p.adresse));
    return {
      age: ages.length ? (ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(1).replace('.', ',') : '—',
      villes: villes.size,
    };
  });

  protected name = fullName;
  protected date = formatDate;
  protected phone = formatPhone;
  protected age = ageOf;
  protected time = formatTime;
  protected flash = (p: Personne) => this.store.highlights().get(p.id.toString()) ?? null;
}

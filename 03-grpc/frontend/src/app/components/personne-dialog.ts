import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { create } from '@bufbuild/protobuf';
import { AjouterRequestSchema, ModifierRequestSchema } from '../gen/personne_pb';
import { wire } from '../core/grpc';
import { emptyForm, formFrom, fullName, normalize, validate, type FormErrors, type PersonneForm } from '../core/format';
import { PersonnesStore } from '../core/personnes.store';
import { Ui } from '../core/ui';
import { Avatar } from './avatar';

/** Formulaire d'ajout / modification avec aperçu du message Protobuf envoyé */
@Component({
  selector: 'app-personne-dialog',
  imports: [FormsModule, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './personne-dialog.html',
})
export class PersonneDialog {
  protected readonly ui = inject(Ui);
  private readonly store = inject(PersonnesStore);

  protected readonly form = signal<PersonneForm>(emptyForm());
  protected readonly errors = signal<FormErrors>({});
  protected readonly saving = signal(false);
  private touched = false;

  protected readonly personne = computed(() => this.ui.editor().personne);
  protected readonly editing = computed(() => this.personne() !== null);
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly fields: { key: keyof PersonneForm; label: string; type: string; placeholder: string; wide?: boolean }[] = [
    { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Amadou' },
    { key: 'nom', label: 'Nom', type: 'text', placeholder: 'DIOP' },
    { key: 'dateNaissance', label: 'Date de naissance', type: 'date', placeholder: '' },
    { key: 'telephone', label: 'Téléphone', type: 'tel', placeholder: '77 123 45 67' },
    { key: 'adresse', label: 'Adresse', type: 'text', placeholder: 'Ziguinchor', wide: true },
  ];

  /** Message réellement construit : JSON lisible + taille binaire Protobuf */
  protected readonly preview = computed(() => {
    const f = normalize(this.form());
    const p = this.personne();
    return p
      ? wire(ModifierRequestSchema, create(ModifierRequestSchema, { id: p.id, ...f }))
      : wire(AjouterRequestSchema, create(AjouterRequestSchema, f));
  });

  protected readonly title = computed(() => {
    const f = this.form();
    if (f.prenom || f.nom) return fullName(f);
    const p = this.personne();
    return p ? fullName(p) : 'Nouvelle personne';
  });

  constructor() {
    effect(() => {
      const { open, personne } = this.ui.editor();
      if (!open) return;
      this.form.set(personne ? formFrom(personne) : emptyForm());
      this.errors.set({});
      this.touched = false;
      setTimeout(() => document.querySelector<HTMLInputElement>('.editor-form input')?.focus(), 60);
    });
  }

  protected set(key: keyof PersonneForm, value: string): void {
    this.form.update((f) => ({ ...f, [key]: value }));
    if (this.touched) this.errors.set(validate(this.form()));
  }

  protected async submit(): Promise<void> {
    this.touched = true;
    const errs = validate(this.form());
    this.errors.set(errs);
    if (Object.keys(errs).length) return;
    this.saving.set(true);
    try {
      const data = normalize(this.form());
      const p = this.personne();
      if (p) await this.store.modifier(p.id, data);
      else await this.store.ajouter(data);
      this.ui.closeEditor();
    } catch {
      /* notification affichée, la fenêtre reste ouverte */
    } finally {
      this.saving.set(false);
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.ui.editor().open && !this.saving()) this.ui.closeEditor();
  }
}

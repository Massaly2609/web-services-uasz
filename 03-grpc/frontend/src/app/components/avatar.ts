import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { hueOf, initials } from '../core/format';

/** Avatar hexagonal (clin d'œil au logo gRPC / Protobuf) */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="hex" [style.--h]="hue()" [style.width.px]="size()" [style.height.px]="size()"
    [style.font-size.px]="size() * 0.34">{{ text() }}</span>`,
  host: { 'aria-hidden': 'true' },
})
export class Avatar {
  readonly nom = input('');
  readonly prenom = input('');
  readonly size = input(42);
  readonly hue = computed(() => hueOf(this.nom() + this.prenom()));
  readonly text = computed(() => initials({ nom: this.nom(), prenom: this.prenom() }));
}

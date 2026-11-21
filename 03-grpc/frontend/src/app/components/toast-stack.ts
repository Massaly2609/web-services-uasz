import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toasts } from '../core/toasts';

@Component({
  selector: 'app-toast-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (t of toasts.list(); track t.id) {
        <div class="toast" [attr.data-kind]="t.kind">
          <span class="toast-mark">{{ t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i' }}</span>
          <div class="toast-body">
            <div class="toast-title">{{ t.title }}</div>
            @if (t.detail) {
              <div class="toast-detail">{{ t.detail }}</div>
            }
          </div>
          <button class="toast-close" (click)="toasts.dismiss(t.id)" aria-label="Fermer">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastStack {
  protected readonly toasts = inject(Toasts);
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModeStore, AppMode } from '../../../stores/mode.store';

@Component({
  selector: 'app-mode-indicator',
  template: `
    @if (!modeStore.isViewMode()) {
      <div class="mode-border" [class]="borderClass()">
        <span class="mode-label">{{ modeLabel() }}</span>
      </div>
    }
  `,
  styles: [`
    .mode-border {
      position: fixed;
      inset: 0;
      pointer-events: none;
      border: 3px solid;
      z-index: 9999;
    }
    .mode-edit-holds {
      border-color: #f1c40f;
    }
    .mode-create-route {
      border-color: #2ecc71;
    }
    .mode-edit-route {
      border-color: #3498db;
    }
    .mode-label {
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      color: #000;
      background: inherit;
    }
    .mode-edit-holds .mode-label {
      background: #f1c40f;
    }
    .mode-create-route .mode-label {
      background: #2ecc71;
    }
    .mode-edit-route .mode-label {
      background: #3498db;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeIndicatorComponent {
  protected readonly modeStore = inject(ModeStore);

  protected readonly borderClass = computed(() => {
    switch (this.modeStore.mode()) {
      case AppMode.EditHolds: return 'mode-edit-holds';
      case AppMode.CreateRoute: return 'mode-create-route';
      case AppMode.EditRoute: return 'mode-edit-route';
      default: return '';
    }
  });

  protected readonly modeLabel = computed(() => {
    switch (this.modeStore.mode()) {
      case AppMode.EditHolds: return 'Edit Holds';
      case AppMode.CreateRoute: return 'Create Route';
      case AppMode.EditRoute: return 'Edit Route';
      default: return '';
    }
  });
}

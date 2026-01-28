import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  signal,
  effect,
  inject,
  DestroyRef,
  output,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Hold, HoldsResponse } from '../../../data-contracts/hold.model';

/** Color constants for hold visualization */
const HOLD_COLOR_SELECTED = '#ffcc00'; // Gold/yellow for selected holds

@Component({
  selector: 'app-hold-loader',
  templateUrl: './hold-loader.component.html',
  styleUrl: './hold-loader.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HoldLoaderComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly wallId = input.required<number>();
  readonly versionId = input.required<number>();
  readonly modelUrl = input.required<string>();
  readonly holdGeometry = input<string>('sphere');
  readonly holdColor = input<string>('#00ff00');

  readonly holds = signal<Hold[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** Emitted when a hold is clicked */
  readonly holdClicked = output<number>();

  constructor() {
    // Load holds when inputs change
    effect(() => {
      const wallId = this.wallId();
      const versionId = this.versionId();
      this.loadHolds(wallId, versionId);
    });
  }

  private loadHolds(wallId: number, versionId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    const url = `https://192.168.0.113:5000/peaked/walls/${wallId}/versions/${versionId}/holds-plus`;

    this.http
      .get<HoldsResponse>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.holds.set(response.data);
          this.isLoading.set(false);
          console.log(`Loaded ${response.data.length} holds`);
        },
        error: (err) => {
          this.error.set(err.message);
          this.isLoading.set(false);
          console.error('Failed to load holds:', err);
        },
      });
  }
}

import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, input } from '@angular/core';
import { Hold } from '../../../data-contracts/hold.model';

@Component({
  selector: 'app-hold-renderer',
  templateUrl: './hold-renderer.html',
  styleUrl: './hold-renderer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
})
export class HoldRendererComponent {
  readonly holds = input<Hold[]>([]);

  constructor() {
    effect(() => {
      const holds = this.holds();
      console.log('HoldRenderer: holds updated, count:', holds.length);
      if (holds.length > 0) {
        console.log('HoldRenderer: First hold position:', holds[0].x, holds[0].y, holds[0].z);
        console.log('HoldRenderer: Sample holds:', holds.slice(0, 3));
      }
    });
  }
}

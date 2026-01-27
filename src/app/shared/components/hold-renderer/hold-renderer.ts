import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
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
}

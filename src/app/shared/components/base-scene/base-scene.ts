import { 
  ChangeDetectionStrategy, 
  Component, 
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  input,
  output,
  signal
} from '@angular/core';
import { HoldRendererComponent } from '../hold-renderer/hold-renderer';
import { Hold } from '../../../data-contracts/hold.model';

@Component({
  selector: 'app-base-scene',
  imports: [HoldRendererComponent],
  standalone: true,
  templateUrl: './base-scene.html',
  styleUrl: './base-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BaseSceneComponent implements AfterViewInit {
  @ViewChild('scene', { static: false }) sceneElement!: ElementRef<HTMLElement>;

  // Inputs
  readonly wallModelUrl = input<string>('');
  readonly holds = input<Hold[]>([]);
  readonly visible = input(true);

  // Outputs
  readonly sceneReady = output<void>();

  ngAfterViewInit(): void {
    const scene = this.sceneElement.nativeElement;
    
    scene.addEventListener('loaded', () => {
      this.sceneReady.emit();
    }, { once: true });
  }
}

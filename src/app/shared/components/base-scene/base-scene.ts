import { 
  ChangeDetectionStrategy, 
  Component, 
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  input,
  output,
} from '@angular/core';
import { Hold } from '../../../data-contracts/hold.model';

@Component({
  selector: 'app-base-scene',
  imports: [],
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

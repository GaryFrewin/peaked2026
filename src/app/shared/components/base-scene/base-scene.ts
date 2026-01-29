import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  input,
  output,
  Injector,
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
  @ViewChild('holdsContainer', { static: false }) holdsContainerRef!: ElementRef<HTMLElement>;

  // Inputs
  readonly wallModelUrl = input<string>('');
  readonly holds = input<Hold[]>([]);
  readonly visible = input(true);

  // Outputs
  readonly sceneReady = output<void>();

  constructor(private injector: Injector) {
    // Make Angular injector globally accessible for A-Frame components
    (window as any).__appInjector = this.injector;
  }

  ngAfterViewInit(): void {
    const scene = this.sceneElement.nativeElement;

    scene.addEventListener(
      'loaded',
      () => {
        this.sceneReady.emit();
        
        // Prevent context menu on the A-Frame canvas
        const canvas = scene.querySelector('canvas');
        if (canvas) {
          canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, { capture: true });
        }
      },
      { once: true }
    );
  }
}

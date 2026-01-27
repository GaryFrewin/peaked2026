import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  AfterViewInit,
} from '@angular/core';

// A-Frame side-effect import - only runs in browser, not in tests
declare var AFRAME: any;

@Component({
  selector: 'app-gltf-loader',
  templateUrl: './gltf-loader.component.html',
  styleUrl: './gltf-loader.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GltfLoaderComponent implements AfterViewInit {
  readonly modelUrl = input.required<string>();

  ngAfterViewInit(): void {
    if (typeof AFRAME !== 'undefined') {
      console.log('A-Frame version:', AFRAME.version);
    }

    // Debug: Listen for model loading events
    setTimeout(() => {
      const modelEl = document.querySelector('#loaded-model');
      if (modelEl) {
        console.log('GLTF: Model element found, gltf-model attr:', modelEl.getAttribute('gltf-model'));
        
        modelEl.addEventListener('model-loaded', () => {
          console.log('GLTF: Model loaded successfully!');
        });
        
        modelEl.addEventListener('model-error', (e: any) => {
          console.error('GLTF: Model failed to load!', e.detail);
        });
      }
    }, 100);
  }
}

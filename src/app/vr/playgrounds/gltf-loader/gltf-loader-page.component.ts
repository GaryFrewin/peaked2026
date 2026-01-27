import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GltfLoaderComponent } from './gltf-loader.component';

@Component({
  selector: 'app-gltf-loader-page',
  template: `
    <app-gltf-loader [modelUrl]="modelUrl" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [GltfLoaderComponent],
})
export class GltfLoaderPageComponent {
  readonly modelUrl = 'https://garyfrewin.co.uk/sites/ClimbingData/3Dmodels/TheGarageV3.gltf';
}

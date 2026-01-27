import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HoldLoaderComponent } from './hold-loader.component';

@Component({
  selector: 'app-hold-loader-page',
  template: `
    <app-hold-loader
      [wallId]="1"
      [versionId]="3"
      [modelUrl]="'https://garyfrewin.co.uk/sites/ClimbingData/3Dmodels/TheGarageV3.gltf'" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [HoldLoaderComponent],
})
export class HoldLoaderPageComponent {}

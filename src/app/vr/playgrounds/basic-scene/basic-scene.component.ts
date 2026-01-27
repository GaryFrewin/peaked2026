import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  signal,
  OnInit,
  AfterViewInit,
} from '@angular/core';

// A-Frame is loaded globally via index.html <script> tag
declare var AFRAME: any;

@Component({
  selector: 'app-basic-scene',
  templateUrl: './basic-scene.component.html',
  styleUrls: ['./basic-scene.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BasicSceneComponent implements OnInit, AfterViewInit {
  protected readonly sceneLoaded = signal(false);
  protected readonly vrSupported = signal(false);

  ngOnInit(): void {
    console.log('BasicSceneComponent: ngOnInit');
    console.log('A-Frame version:', AFRAME.version);
  }

  ngAfterViewInit(): void {
    console.log('BasicSceneComponent: ngAfterViewInit');
    
    const scene = document.querySelector('a-scene');
    if (scene) {
      if ((scene as any).hasLoaded) {
        this.onSceneLoaded();
      } else {
        scene.addEventListener('loaded', () => this.onSceneLoaded(), { once: true });
      }
    }

    // Check VR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        this.vrSupported.set(supported);
        console.log('VR supported:', supported);
      });
    }
  }

  private onSceneLoaded(): void {
    console.log('A-Frame scene loaded');
    this.sceneLoaded.set(true);
  }
}

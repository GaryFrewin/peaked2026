import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  signal,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';

/**
 * HOVER PLAYGROUND
 * 
 * Minimal scene to test A-Frame mouseenter/mouseleave events with Angular.
 * 
 * Key learnings to verify:
 * 1. Does A-Frame's cursor component fire mouseenter/mouseleave?
 * 2. Do Angular event bindings (mouseenter)="..." work on a-entity?
 * 3. Does the raycaster need specific configuration?
 * 4. Do look-controls interfere with hover detection?
 */
@Component({
  selector: 'app-hover-playground',
  template: `
    <div class="info-panel">
      <h2>Hover Playground</h2>
      <p><strong>Last hover event:</strong> {{ lastEvent() }}</p>
      <p><strong>Currently hovered:</strong> {{ hoveredSphere() ?? 'none' }}</p>
      <p><strong>Event count:</strong> {{ eventCount() }}</p>
      <hr />
      <p>Move your mouse over the spheres. Events should appear above.</p>
    </div>

    <a-scene #scene background="color: #1a1a2e">
      <!-- Lighting -->
      <a-entity light="type: ambient; color: #ffffff; intensity: 0.4"></a-entity>
      <a-entity light="type: directional; color: #ffffff; intensity: 0.6" position="1 2 1"></a-entity>

      <!-- Test spheres with Angular event bindings -->
      <a-sphere
        class="hoverable"
        position="-1 1.5 -3"
        radius="0.3"
        [attr.color]="hoveredSphere() === 'red' ? '#ff0000' : '#880000'"
        (mouseenter)="onMouseEnter('red')"
        (mouseleave)="onMouseLeave('red')">
      </a-sphere>

      <a-sphere
        class="hoverable"
        position="0 1.5 -3"
        radius="0.3"
        [attr.color]="hoveredSphere() === 'green' ? '#00ff00' : '#008800'"
        (mouseenter)="onMouseEnter('green')"
        (mouseleave)="onMouseLeave('green')">
      </a-sphere>

      <a-sphere
        class="hoverable"
        position="1 1.5 -3"
        radius="0.3"
        [attr.color]="hoveredSphere() === 'blue' ? '#0000ff' : '#000088'"
        (mouseenter)="onMouseEnter('blue')"
        (mouseleave)="onMouseLeave('blue')">
      </a-sphere>

      <!-- Mouse cursor for raycasting -->
      <a-entity
        id="mouseCursor"
        cursor="rayOrigin: mouse; fuse: false"
        raycaster="objects: .hoverable; far: 100">
      </a-entity>

      <!-- Camera with look-controls (this might be the problem?) -->
      <a-entity id="rig" position="0 0 0">
        <a-camera position="0 1.6 0" look-controls wasd-controls></a-camera>
      </a-entity>
    </a-scene>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      position: relative;
    }
    
    .info-panel {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 100;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      min-width: 300px;
    }
    
    .info-panel h2 {
      margin-top: 0;
      color: #00ffaa;
    }
    
    a-scene {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HoverPlaygroundComponent implements AfterViewInit {
  @ViewChild('scene', { static: false }) sceneElement!: ElementRef<HTMLElement>;

  readonly lastEvent = signal<string>('none');
  readonly hoveredSphere = signal<string | null>(null);
  readonly eventCount = signal(0);

  ngAfterViewInit(): void {
    const scene = this.sceneElement.nativeElement;
    
    // Log when scene is ready
    scene.addEventListener('loaded', () => {
      console.log('🎬 Hover playground scene loaded');
      this.lastEvent.set('Scene loaded');
      
      // Also try listening at the scene level for debugging
      this.setupDebugListeners();
    }, { once: true });
  }

  onMouseEnter(sphereName: string): void {
    console.log(`🟢 mouseenter: ${sphereName}`);
    this.hoveredSphere.set(sphereName);
    this.lastEvent.set(`mouseenter: ${sphereName}`);
    this.eventCount.update(c => c + 1);
  }

  onMouseLeave(sphereName: string): void {
    console.log(`🔴 mouseleave: ${sphereName}`);
    if (this.hoveredSphere() === sphereName) {
      this.hoveredSphere.set(null);
    }
    this.lastEvent.set(`mouseleave: ${sphereName}`);
    this.eventCount.update(c => c + 1);
  }

  /**
   * Debug: Listen for raycaster events at the scene level
   */
  private setupDebugListeners(): void {
    const scene = this.sceneElement.nativeElement;
    
    // Listen for raycaster intersection events
    scene.addEventListener('raycaster-intersection', (evt: any) => {
      console.log('🎯 raycaster-intersection:', evt.detail);
    });
    
    scene.addEventListener('raycaster-intersection-cleared', (evt: any) => {
      console.log('🎯 raycaster-intersection-cleared:', evt.detail);
    });

    // Also try to find the cursor entity and listen there
    const cursor = scene.querySelector('#mouseCursor');
    if (cursor) {
      cursor.addEventListener('mouseenter', (evt: any) => {
        console.log('🖱️ cursor mouseenter on:', evt.detail?.intersectedEl);
      });
      cursor.addEventListener('mouseleave', (evt: any) => {
        console.log('🖱️ cursor mouseleave from:', evt.detail?.intersectedEl);
      });
    }
  }
}

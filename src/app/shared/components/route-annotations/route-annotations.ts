import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { CreateRouteStateStore } from '../../../stores/create-route-state.store';
import { HoldStore } from '../../../stores/hold.store';

declare const AFRAME: any;
declare const THREE: any;

interface Annotation {
  holdId: number;
  worldPosition: { x: number; y: number; z: number };
  label: string;
  start: boolean;
  end: boolean;
  screenX: number;
  screenY: number;
}

/**
 * ROUTE ANNOTATIONS COMPONENT
 *
 * 2D overlay showing hold type labels (FH, FF, RH, RF) for route holds.
 * Projects 3D hold positions to screen space with lines connecting labels to holds.
 *
 * Modern signal-based implementation:
 * - Computes annotations from CreateRouteStateStore.draftRoute()
 * - Uses effect() for requestAnimationFrame screen projection
 * - No separate service needed
 */
@Component({
  selector: 'app-route-annotations',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './route-annotations.html',
  styleUrl: './route-annotations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteAnnotationsComponent implements OnDestroy {
  private readonly createRouteState = inject(CreateRouteStateStore);
  private readonly holdStore = inject(HoldStore);

  private camera?: any;
  private animationFrameId?: number;

  protected readonly annotations = signal<Annotation[]>([]);

  // Compute annotations from draft route
  private readonly annotationData = computed(() => {
    const draft = this.createRouteState.draftRoute();
    if (!draft) return [];

    const allHolds = this.holdStore.holds();
    const result: Annotation[] = [];

    (draft.route_holds ?? []).forEach((routeHold: any) => {
      const holdId = routeHold.hold_id;
      if (!holdId) return;

      const hold = allHolds.find((h) => h.id === holdId);
      if (!hold) return;

      // Determine label based on flags
      let label = '';
      const isStart = routeHold.forwardhandstart || routeHold.forwardfootstart;
      const isEnd = routeHold.reversehandstart || routeHold.reversefootstart;

      if (routeHold.forwardhandstart) label = 'FH';
      else if (routeHold.forwardfootstart) label = 'FF';
      else if (routeHold.reversehandstart) label = 'RH';
      else if (routeHold.reversefootstart) label = 'RF';

      result.push({
        holdId: hold.id,
        worldPosition: { x: hold.x, y: hold.y, z: hold.z },
        label,
        start: isStart,
        end: isEnd,
        screenX: 0,
        screenY: 0,
      });
    });

    return result;
  });

  constructor() {
    // Update annotations when computed data changes
    effect(() => {
      this.annotations.set(this.annotationData());
    });

    // Start screen position updates
    effect(() => {
      const annotations = this.annotations();
      if (annotations.length > 0) {
        this.findCamera();
        this.updateScreenPositions();
      }
    });
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private findCamera(): void {
    if (this.camera) return;

    const sceneEl = document.querySelector('a-scene') as any;
    if (!sceneEl) return;

    const cameraEl = sceneEl.querySelector('#player') || sceneEl.querySelector('#cameraRig a-camera') || sceneEl.querySelector('a-camera');
    if (!cameraEl) {
      console.warn('[route-annotations] No camera found');
      return;
    }

    this.camera = cameraEl.getObject3D('camera');
  }

  private updateScreenPositions(): void {
    this.animationFrameId = requestAnimationFrame(() => this.updateScreenPositions());

    if (!this.camera) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const canvas = document.getElementById('annotation-lines') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas if needed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    this.annotations.update(annotations => {
      return annotations.map(annotation => {
        const vector = new AFRAME.THREE.Vector3(
          annotation.worldPosition.x,
          annotation.worldPosition.y,
          annotation.worldPosition.z
        );

        // Check if behind camera
        const viewVector = vector.clone();
        viewVector.applyMatrix4(this.camera!.matrixWorldInverse);

        if (viewVector.z > 0) {
          // Behind camera
          return { ...annotation, screenX: -1000, screenY: -1000 };
        }

        vector.project(this.camera!);

        // Check if outside viewport
        if (vector.x < -1 || vector.x > 1 || vector.y < -1 || vector.y > 1) {
          return { ...annotation, screenX: -1000, screenY: -1000 };
        }

        const screenX = (vector.x * 0.5 + 0.5) * width;
        const screenY = (-vector.y * 0.5 + 0.5) * height;

        const annotationScreenX = screenX - 30;
        const annotationScreenY = screenY - 40;

        // Draw line from hold to annotation (only for start/end)
        if (annotation.start || annotation.end) {
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(annotationScreenX, annotationScreenY);
          ctx.strokeStyle = annotation.start ? 'chartreuse' : 'cyan';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        return {
          ...annotation,
          screenX: annotationScreenX,
          screenY: annotationScreenY,
        };
      });
    });
  }
}

/**
 * Surface Cursor A-Frame Component
 *
 * Shows a cursor where the raycast from a controller intersects
 * a target surface. Emits events when the user confirms placement.
 *
 * Usage:
 * ```html
 * <a-entity id="rightController"
 *   laser-controls="hand: right"
 *   raycaster="objects: .intersectable"
 *   surface-cursor="cursorEl: #cursor-visual; targetClass: intersectable">
 * </a-entity>
 *
 * <a-sphere id="cursor-visual" radius="0.02" color="#00ff00" visible="false"></a-sphere>
 * ```
 *
 * Events:
 * - surface-point-selected: Fired when A button pressed while intersecting
 *   Detail: { point: Vector3, normal: Vector3 }
 */

declare const AFRAME: any;
declare const THREE: any;

interface SurfaceCursorData {
  enabled: boolean;
  targetClass: string;
  cursorEl: any; // A-Frame element reference
}

interface Intersection {
  point: { x: number; y: number; z: number };
  object: { el: any };
  face: { normal: { x: number; y: number; z: number } };
}

export function registerSurfaceCursorComponent(): void {
  if (typeof AFRAME === 'undefined') {
    console.warn('AFRAME not found, cannot register surface-cursor component');
    return;
  }

  if (AFRAME.components['surface-cursor']) {
    return; // Already registered
  }

  AFRAME.registerComponent('surface-cursor', {
    schema: {
      enabled: { type: 'boolean', default: true },
      targetClass: { type: 'string', default: 'intersectable' },
      cursorEl: { type: 'selector' },
    },

    currentIntersection: null as Intersection | null,

    init: function () {
      this.currentIntersection = null;

      console.log('[surface-cursor] Initializing on', this.el.id);
      console.log('[surface-cursor] cursorEl:', this.data.cursorEl);
      console.log('[surface-cursor] targetClass:', this.data.targetClass);

      // Bind methods
      this.onAButton = this.onAButton.bind(this);

      // Listen for A button (abuttondown on Oculus controllers)
      this.el.addEventListener('abuttondown', this.onAButton);
      // Also support trigger for non-A-button controllers
      this.el.addEventListener('triggerdown', this.onAButton);
    },

    remove: function () {
      this.el.removeEventListener('abuttondown', this.onAButton);
      this.el.removeEventListener('triggerdown', this.onAButton);
    },

    tick: function () {
      const data = this.data as SurfaceCursorData;
      const raycaster = this.el.components.raycaster;

      if (!raycaster || !data.cursorEl) {
        return;
      }

      const intersections = raycaster.intersections || [];

      // Find first intersection with target class
      const intersection = intersections.find((int: Intersection) => {
        const el = int.object?.el;
        if (!el || !el.classList) return false;
        return el.classList.contains(data.targetClass);
      });

      if (intersection) {
        this.currentIntersection = intersection;

        // Position cursor at intersection point
        const point = intersection.point;
        data.cursorEl.object3D.position.set(point.x, point.y, point.z);

        // Align cursor to surface normal if available
        if (intersection.face?.normal) {
          const normal = intersection.face.normal;
          // Point cursor along surface normal
          data.cursorEl.object3D.lookAt(
            point.x + normal.x,
            point.y + normal.y,
            point.z + normal.z
          );
        }

        // Show cursor
        data.cursorEl.object3D.visible = true;
      } else {
        this.currentIntersection = null;
        data.cursorEl.object3D.visible = false;
      }
    },

    onAButton: function () {
      const data = this.data as SurfaceCursorData;

      if (!data.enabled) {
        return;
      }

      if (!this.currentIntersection) {
        return;
      }

      const point = this.currentIntersection.point;
      const normal = this.currentIntersection.face?.normal || { x: 0, y: 0, z: 1 };

      // Emit event with intersection details
      this.el.emit('surface-point-selected', {
        point: { x: point.x, y: point.y, z: point.z },
        normal: { x: normal.x, y: normal.y, z: normal.z },
      });
    },
  });
}

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
  markerClass: string; // Class for markers that can be grabbed
  wallContainerId: string; // ID of wall container for coordinate conversion
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
      markerClass: { type: 'string', default: 'model-marker' },
      wallContainerId: { type: 'string', default: 'wall-container' },
    },

    currentIntersection: null as Intersection | null,
    grabbedMarker: null as any,
    originalEmissive: '' as string,

    init: function () {
      this.currentIntersection = null;
      this.grabbedMarker = null;

      console.log('[surface-cursor] Initializing on', this.el.id);
      console.log('[surface-cursor] cursorEl:', this.data.cursorEl);
      console.log('[surface-cursor] targetClass:', this.data.targetClass);

      // Bind methods
      this.onAButton = this.onAButton.bind(this);
      this.onGripDown = this.onGripDown.bind(this);
      this.onGripUp = this.onGripUp.bind(this);

      // Listen for A button only (abuttondown on Oculus controllers)
      // Trigger is reserved for wall-manipulator scale/rotate
      this.el.addEventListener('abuttondown', this.onAButton);
      
      // Grip for marker adjustment
      this.el.addEventListener('gripdown', this.onGripDown);
      this.el.addEventListener('gripup', this.onGripUp);
    },

    remove: function () {
      this.el.removeEventListener('abuttondown', this.onAButton);
      this.el.removeEventListener('gripdown', this.onGripDown);
      this.el.removeEventListener('gripup', this.onGripUp);
    },

    tick: function () {
      const data = this.data as SurfaceCursorData;
      const raycaster = this.el.components.raycaster;

      if (!raycaster || !data.cursorEl) {
        return;
      }

      const intersections = raycaster.intersections || [];

      // Find first intersection with target class that is NOT a marker
      // This ensures cursor/grabbed marker follows the wall surface, not other markers
      const intersection = intersections.find((int: Intersection) => {
        const el = int.object?.el;
        if (!el || !el.classList) return false;
        // Must have targetClass but NOT be a marker
        return el.classList.contains(data.targetClass) && !el.classList.contains(data.markerClass);
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
        
        // If we're grabbing a marker, move it to follow the cursor (in local space)
        if (this.grabbedMarker && data.enabled) {
          const wallContainer = document.getElementById(data.wallContainerId) as any;
          if (wallContainer && wallContainer.object3D) {
            const worldPoint = new THREE.Vector3(point.x, point.y, point.z);
            const localPoint = wallContainer.object3D.worldToLocal(worldPoint);
            this.grabbedMarker.object3D.position.copy(localPoint);
          }
        }
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

    onGripDown: function () {
      const data = this.data as SurfaceCursorData;
      if (!data.enabled) return;

      const raycaster = this.el.components.raycaster;
      if (!raycaster) return;

      const intersections = raycaster.intersections || [];
      
      // Find first intersection with a marker
      for (const int of intersections) {
        const el = int.object?.el;
        if (el && el.classList && el.classList.contains(data.markerClass)) {
          this.grabbedMarker = el;
          // Store original emissive and highlight
          this.originalEmissive = el.getAttribute('material')?.emissive || '#ffffff';
          el.setAttribute('material', 'emissive: #ffffff; emissiveIntensity: 0.8');
          console.log('[surface-cursor] Grabbed marker:', el.id);
          return;
        }
      }
    },

    onGripUp: function () {
      if (this.grabbedMarker) {
        // Restore original emissive
        this.grabbedMarker.setAttribute('material', `emissive: ${this.originalEmissive}; emissiveIntensity: 0.3`);
        console.log('[surface-cursor] Released marker:', this.grabbedMarker.id);
        
        // Emit event with updated marker position
        this.el.emit('marker-adjusted', {
          markerId: this.grabbedMarker.id,
          position: {
            x: this.grabbedMarker.object3D.position.x,
            y: this.grabbedMarker.object3D.position.y,
            z: this.grabbedMarker.object3D.position.z,
          },
        });
        
        this.grabbedMarker = null;
      }
    },
  });
}

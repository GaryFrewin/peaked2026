/**
 * Marker Placer A-Frame Component
 *
 * Handles placing calibration markers at the controller tip position.
 * - Shows ghost marker at controller tip when enabled
 * - Places real markers on A button press
 * - Emits events for UI updates
 *
 * @ported-from peaked/src/app/pages/playground/playground-calibrate/marker-placer.ts
 */

declare var AFRAME: any;

export function registerMarkerPlacerComponent(): void {
  // Guard: Only register if AFRAME is available
  if (typeof AFRAME === 'undefined') {
    console.warn('[marker-placer] AFRAME not available, skipping registration');
    return;
  }

  if (AFRAME.components?.['marker-placer']) {
    console.log('[marker-placer] Already registered, skipping');
    return;
  }

  const THREE = AFRAME.THREE;

  console.log('[marker-placer] Registering component');

  AFRAME.registerComponent('marker-placer', {
    schema: {
      enabled: { type: 'boolean', default: false },
      maxMarkers: { type: 'int', default: 3 },
    },

    init: function () {
      this.ghostMarker = this.el.sceneEl.querySelector('#ghost-marker');
      this.markersPlaced = 0;
      this.markerPositions = [];
      this.grabbedMarker = null;
      this.grabDistance = 0;

      // Bind handlers
      this.onAButton = this.onAButton.bind(this);
      this.onGripDown = this.onGripDown.bind(this);
      this.onGripUp = this.onGripUp.bind(this);

      // Attach listeners
      this.el.addEventListener('abuttondown', this.onAButton);
      this.el.addEventListener('gripdown', this.onGripDown);
      this.el.addEventListener('gripup', this.onGripUp);

      console.log('[marker-placer] Initialized - enabled:', this.data.enabled);
    },

    update: function (oldData: any) {
      if (oldData.enabled !== this.data.enabled) {
        console.log(
          `[marker-placer] enabled changed: ${oldData.enabled} -> ${this.data.enabled}`
        );
        if (
          this.data.enabled &&
          this.ghostMarker &&
          this.markersPlaced < this.data.maxMarkers
        ) {
          this.ghostMarker.setAttribute('visible', 'true');
        } else if (!this.data.enabled && this.ghostMarker) {
          this.ghostMarker.setAttribute('visible', 'false');
        }
      }
    },

    tick: function () {
      if (!this.data.enabled) return;

      // Get controller world position using raycaster origin if available
      const raycaster = this.el.components.raycaster;
      let tipPos;
      
      if (raycaster && raycaster.raycaster && raycaster.raycaster.ray) {
        // Use the raycaster origin - this is where the laser starts
        tipPos = raycaster.raycaster.ray.origin.clone();
      } else {
        // Fallback: get controller world position
        tipPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(tipPos);
      }

      // Update ghost marker to follow controller (if not all placed and not grabbing)
      if (
        this.ghostMarker &&
        this.markersPlaced < this.data.maxMarkers &&
        !this.grabbedMarker
      ) {
        // Set position directly in world space
        this.ghostMarker.object3D.position.copy(tipPos);
      }

      // Update grabbed marker position - maintain distance along ray
      if (this.grabbedMarker && this.grabDistance > 0 && raycaster && raycaster.raycaster) {
        const ray = raycaster.raycaster.ray;
        const newPos = ray.origin
          .clone()
          .add(ray.direction.clone().multiplyScalar(this.grabDistance));
        this.grabbedMarker.object3D.position.copy(newPos);
      }
    },

    getTipPosition: function () {
      // Use raycaster origin if available for accurate position
      const raycaster = this.el.components.raycaster;
      if (raycaster && raycaster.raycaster && raycaster.raycaster.ray) {
        return raycaster.raycaster.ray.origin.clone();
      }
      
      // Fallback: controller world position
      const pos = new THREE.Vector3();
      this.el.object3D.getWorldPosition(pos);
      return pos;
    },

    onAButton: function () {
      console.log(
        `[marker-placer] A button pressed - enabled: ${this.data.enabled}, markersPlaced: ${this.markersPlaced}/${this.data.maxMarkers}`
      );

      if (!this.data.enabled) {
        console.log('[marker-placer] A button ignored - not enabled');
        return;
      }
      if (this.markersPlaced >= this.data.maxMarkers) {
        console.log('[marker-placer] A button ignored - max markers reached');
        return;
      }

      const tipPos = this.getTipPosition();
      this.markersPlaced++;

      const marker = this.el.sceneEl.querySelector(
        `#real-marker-${this.markersPlaced}`
      );
      if (marker) {
        marker.object3D.position.copy(tipPos);
        marker.setAttribute('visible', 'true');

        // Store position
        this.markerPositions.push({ x: tipPos.x, y: tipPos.y, z: tipPos.z });

        // Pulse feedback animation
        marker.setAttribute(
          'animation__pulse',
          'property: scale; from: 1 1 1; to: 2 2 2; dur: 150; dir: alternate; loop: 2'
        );

        console.log(
          `[marker-placer] ✅ Placed marker ${this.markersPlaced} at`,
          tipPos
        );

        // Emit event for UI updates
        this.el.emit('marker-placed', {
          count: this.markersPlaced,
          position: tipPos,
          positions: this.markerPositions,
        });

        // Hide ghost if all placed
        if (
          this.markersPlaced >= this.data.maxMarkers &&
          this.ghostMarker
        ) {
          this.ghostMarker.setAttribute('visible', 'false');
        }
      } else {
        console.error(
          `[marker-placer] Could not find real-marker-${this.markersPlaced}`
        );
      }
    },

    onGripDown: function () {
      console.log(`[marker-placer] Grip down - enabled: ${this.data.enabled}`);
      if (!this.data.enabled) return;

      // Use raycaster to find intersected marker
      const raycaster = this.el.components.raycaster;
      if (raycaster && raycaster.intersections.length > 0) {
        const intersection = raycaster.intersections[0];
        const intersected = intersection.object.el;
        if (intersected && intersected.classList.contains('grabbable')) {
          this.grabbedMarker = intersected;
          this.grabbedMarker.setAttribute('color', '#f0883e'); // Orange when grabbed

          // Store the distance from controller to marker at grab time
          this.grabDistance = intersection.distance;

          console.log(
            '[marker-placer] Grabbed',
            intersected.id,
            'at distance',
            this.grabDistance
          );
        }
      }
    },

    onGripUp: function () {
      if (this.grabbedMarker) {
        // Update stored position
        const id = this.grabbedMarker.id;
        const match = id.match(/real-marker-(\d+)/);
        if (match) {
          const index = parseInt(match[1]) - 1;
          const pos = this.grabbedMarker.object3D.position;
          this.markerPositions[index] = { x: pos.x, y: pos.y, z: pos.z };
          console.log(`[marker-placer] Updated marker ${index + 1} position`);
        }

        // Restore original color based on marker index
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d'];
        const match2 = id.match(/real-marker-(\d+)/);
        if (match2) {
          const colorIndex = parseInt(match2[1]) - 1;
          this.grabbedMarker.setAttribute('color', colors[colorIndex]);
        }

        this.grabbedMarker = null;

        // Emit updated positions
        this.el.emit('markers-updated', { positions: this.markerPositions });
      }
    },

    getMarkerPositions: function () {
      console.log(
        '[marker-placer] getMarkerPositions() returning',
        this.markerPositions
      );
      return this.markerPositions;
    },

    remove: function () {
      console.log('[marker-placer] Component removing');
      this.el.removeEventListener('abuttondown', this.onAButton);
      this.el.removeEventListener('gripdown', this.onGripDown);
      this.el.removeEventListener('gripup', this.onGripUp);
    },
  });
}

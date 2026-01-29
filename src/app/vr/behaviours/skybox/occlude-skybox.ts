/**
 * Occlude Skybox A-Frame Component
 * 
 * Creates an invisible copy of the wall that masks the skybox,
 * allowing the real wall to be visible "through" the skybox.
 * 
 * The occluder wall has colorWrite:false, meaning it doesn't render
 * any color but still writes to the depth buffer. This causes the
 * skybox (rendered behind) to be occluded where the wall shape is.
 * 
 * Usage:
 *   <a-entity occlude-skybox="enabled: true; wallSelector: #wall-container"></a-entity>
 * 
 * The Angular component should update 'enabled' based on SettingsStore.occludeSkybox()
 */

declare const AFRAME: any;

// Only register if A-Frame is available (not in unit tests)
if (typeof AFRAME !== 'undefined') {
  const THREE = AFRAME.THREE;

  AFRAME.registerComponent('occlude-skybox', {
    schema: {
      enabled: { type: 'boolean', default: true },
      wallSelector: { type: 'string', default: '#wall-container' }
    },

    init: function () {
      console.log('[occlude-skybox] Initialized');
      this.occluderWall = null;
      this.wallModelLoadedHandler = this.onWallModelLoaded.bind(this);
      
      // Watch for the wall model to load
      this.watchForWall();
    },

    update: function (oldData: any) {
      if (oldData.enabled !== this.data.enabled) {
        console.log('[occlude-skybox] Enabled changed:', this.data.enabled);
        if (this.data.enabled) {
          this.createOccluder();
        } else {
          this.removeOccluder();
        }
      }
    },

    watchForWall: function () {
      const wallEl = document.querySelector(this.data.wallSelector);
      if (wallEl) {
        // Check if model already loaded
        const mesh = (wallEl as any).getObject3D('mesh');
        if (mesh) {
          this.onWallModelLoaded();
        } else {
          wallEl.addEventListener('model-loaded', this.wallModelLoadedHandler);
        }
      } else {
        // Wall not in DOM yet, wait a bit
        setTimeout(() => this.watchForWall(), 100);
      }
    },

    onWallModelLoaded: function () {
      console.log('[occlude-skybox] Wall model loaded');
      if (this.data.enabled) {
        this.createOccluder();
      }
    },

    createOccluder: function () {
      this.removeOccluder(); // Clean up any existing
      
      const wallEl = document.querySelector(this.data.wallSelector) as any;
      if (!wallEl) {
        console.warn('[occlude-skybox] Wall element not found:', this.data.wallSelector);
        return;
      }

      const wallMesh = wallEl.getObject3D('mesh');
      if (!wallMesh) {
        console.warn('[occlude-skybox] Wall mesh not loaded yet');
        return;
      }

      // Clone the wall mesh
      this.occluderWall = wallMesh.clone();
      
      // Apply occlusion material to all meshes
      this.occluderWall.traverse((node: any) => {
        if (node.isMesh) {
          node.material = new THREE.MeshBasicMaterial({
            colorWrite: false,
            side: THREE.DoubleSide
          });
          node.renderOrder = -1; // Render before other objects
        }
      });

      // Copy the wall's world transform
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      
      wallEl.object3D.getWorldPosition(worldPos);
      wallEl.object3D.getWorldQuaternion(worldQuat);
      wallEl.object3D.getWorldScale(worldScale);
      
      this.occluderWall.position.copy(worldPos);
      this.occluderWall.quaternion.copy(worldQuat);
      this.occluderWall.scale.copy(worldScale);

      // Add to scene
      this.el.sceneEl.object3D.add(this.occluderWall);
      console.log('[occlude-skybox] Occluder wall created');
    },

    removeOccluder: function () {
      if (this.occluderWall) {
        this.el.sceneEl.object3D.remove(this.occluderWall);
        this.occluderWall = null;
        console.log('[occlude-skybox] Occluder wall removed');
      }
    },

    tick: function () {
      // Keep occluder in sync with wall position (in case wall moves due to calibration)
      if (!this.occluderWall || !this.data.enabled) return;
      
      const wallEl = document.querySelector(this.data.wallSelector) as any;
      if (!wallEl) return;

      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      
      wallEl.object3D.getWorldPosition(worldPos);
      wallEl.object3D.getWorldQuaternion(worldQuat);
      wallEl.object3D.getWorldScale(worldScale);
      
      this.occluderWall.position.copy(worldPos);
      this.occluderWall.quaternion.copy(worldQuat);
      this.occluderWall.scale.copy(worldScale);
    },

    remove: function () {
      this.removeOccluder();
      const wallEl = document.querySelector(this.data.wallSelector);
      if (wallEl) {
        wallEl.removeEventListener('model-loaded', this.wallModelLoadedHandler);
      }
      console.log('[occlude-skybox] Component removed');
    }
  });
}

export {};

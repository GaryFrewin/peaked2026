/**
 * Calibrated Anchor Component
 *
 * Handles WebXR persistent anchors for wall calibration.
 * - On VR enter: checks localStorage for saved anchor UUID and restores it
 * - createAnchor(): creates a new persistent anchor at current position/rotation/scale
 * - deleteAnchor(): removes the anchor
 * - tick(): updates entity position from anchor pose each frame
 *
 * Uses a shared localStorage key ('anchor-wall-calibration') so different scenes
 * (vr-calibration-page, vr-climbing) can share the same anchor.
 *
 * @ported-from peaked/src/app/aframe-components/behaviours/calibration/calibrated-anchor.ts
 */

declare const AFRAME: any;

// WebXR types (not fully typed in standard lib)
declare class XRRigidTransform {
  constructor(
    position?: { x: number; y: number; z: number },
    orientation?: { x: number; y: number; z: number; w: number }
  );
}

let componentRegistered = false;

export function registerCalibratedAnchorComponent(): void {
  if (componentRegistered) return;
  if (typeof AFRAME === 'undefined') {
    console.warn('[calibrated-anchor] AFRAME not available, skipping registration');
    return;
  }

  const THREE = AFRAME.THREE;

  AFRAME.registerComponent('calibrated-anchor', {
    schema: {
      // Shared key for localStorage - allows different scenes to share anchor data
      storageKey: { type: 'string', default: 'wall-calibration' },
    },

    init: function () {
      console.log('[calibrated-anchor] Initializing component');
      this.checkAnchorFeatureSupport();
      this.anchor = undefined;
      this.auxQuaternion = new THREE.Quaternion();
      this.onEnterVR = this.onEnterVR.bind(this);
      this.el.sceneEl.addEventListener('enter-vr', this.onEnterVR);
      this.persistentHandle = undefined;
      this.scale = { x: 1, y: 1, z: 1 };
    },

    checkAnchorFeatureSupport: function () {
      const sceneEl = this.el.sceneEl;
      const webxrData = sceneEl.getAttribute('webxr');
      if (!webxrData) return;

      const optionalFeaturesArray = webxrData.optionalFeatures;
      if (optionalFeaturesArray && optionalFeaturesArray.indexOf('anchors') === -1) {
        optionalFeaturesArray.push('anchors');
        sceneEl.setAttribute('webxr', webxrData);
        console.log('[calibrated-anchor] WebXR anchors feature enabled');
      } else {
        console.log('[calibrated-anchor] WebXR anchors feature already enabled');
      }
    },

    onEnterVR: async function () {
      console.log('[calibrated-anchor] Entered VR, checking for stored anchor');
      this.anchor = undefined;
      this.checkForAnchorInLocalStorage();
    },

    checkForAnchorInLocalStorage: async function () {
      const storageKey = 'anchor-' + this.data.storageKey;
      console.log('[calibrated-anchor] Checking localStorage for anchor:', storageKey);

      const xrManager = this.el.sceneEl.renderer.xr;
      const session = xrManager.getSession();
      if (!session) {
        console.error('[calibrated-anchor] No active XR session found');
        return;
      }

      const persistentAnchors = session.persistentAnchors; // Array of UUID strings
      console.log('[calibrated-anchor] Session persistent anchors:', persistentAnchors);

      const storedData = localStorage.getItem(storageKey);
      console.log('[calibrated-anchor] Stored data:', storedData);

      if (!storedData) {
        console.warn('[calibrated-anchor] No stored data found for:', storageKey);
        return;
      }

      const { persistentHandle, scale } = JSON.parse(storedData);
      console.log('[calibrated-anchor] Looking for handle:', persistentHandle);

      // If persistent anchors exist in the session
      if (persistentAnchors && persistentHandle) {
        console.log('[calibrated-anchor] Checking against session anchors...');
        for (let i = 0; i < persistentAnchors.length; ++i) {
          if (persistentHandle === persistentAnchors[i]) {
            console.log('[calibrated-anchor] Match found! Restoring anchor');
            this.anchor = await session.restorePersistentAnchor(persistentAnchors[i]);

            if (this.anchor) {
              this.scale = scale;
              this.persistentHandle = persistentAnchors[i];
              console.log('[calibrated-anchor] Anchor restored successfully');
              console.log('[calibrated-anchor] Scale:', this.scale);

              // Emit event to notify restoration
              this.el.emit('anchor-restored', {
                persistentHandle: this.persistentHandle,
                scale: this.scale,
              });
            }
            break;
          }
        }
      }
    },

    clearAllAnchors: async function () {
      const storageKey = 'anchor-' + this.data.storageKey;
      const xrManager = this.el.sceneEl.renderer.xr;
      const session = xrManager.getSession();
      const persistentAnchors = session?.persistentAnchors;
      console.log('[calibrated-anchor] Clearing all anchors:', persistentAnchors);

      if (persistentAnchors && persistentAnchors.length > 0) {
        for (let i = 0; i < persistentAnchors.length; ++i) {
          try {
            await session.deletePersistentAnchor(persistentAnchors[i]);
            console.log('[calibrated-anchor] Deleted anchor:', persistentAnchors[i]);
          } catch (e) {
            console.error('[calibrated-anchor] Failed to delete anchor:', persistentAnchors[i], e);
          }
        }
        localStorage.removeItem(storageKey);
      } else {
        console.warn('[calibrated-anchor] No persistent anchors found to delete');
      }
    },

    /**
     * Create a new WebXR persistent anchor at the entity's current transform.
     * Stores the anchor UUID and scale in localStorage.
     */
    createAnchor: async function () {
      console.log('[calibrated-anchor] Creating anchor...');
      const sceneEl = this.el.sceneEl;
      const xrManager = sceneEl.renderer.xr;
      const session = xrManager.getSession();
      const object3D = this.el.object3D;

      if (!session) {
        console.error('[calibrated-anchor] No XR session - cannot create anchor');
        this.el.emit('anchor-error', { error: 'No XR session' });
        return;
      }

      const position = object3D.position;
      const quaternion = this.auxQuaternion.setFromEuler(object3D.rotation);
      const scale = object3D.scale;

      if (this.anchor) {
        console.log('[calibrated-anchor] Deleting existing anchor first');
        this.deleteAnchor();
      }

      const referenceSpace = xrManager.getReferenceSpace();
      console.log('[calibrated-anchor] Reference space:', referenceSpace);

      // Define the anchor pose
      const anchorPose = new XRRigidTransform(
        { x: position.x, y: position.y, z: position.z },
        { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }
      );
      console.log('[calibrated-anchor] Anchor pose:', anchorPose);

      // Create anchor inside requestAnimationFrame
      session.requestAnimationFrame(async (time: number, frame: any) => {
        // Clear existing anchors first
        console.log('[calibrated-anchor] Clearing existing anchors...');
        await this.clearAllAnchors();

        // Create new anchor
        console.log('[calibrated-anchor] Creating new anchor...');
        const anchor = await (frame as any).createAnchor(anchorPose, referenceSpace);
        console.log('[calibrated-anchor] Anchor created:', anchor);

        const persistentHandle = await anchor.requestPersistentHandle();
        console.log('[calibrated-anchor] Persistent handle:', persistentHandle);
        this.persistentHandle = persistentHandle;

        // Store in localStorage with shared key
        const storageKey = 'anchor-' + this.data.storageKey;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            persistentHandle: persistentHandle,
            scale: { x: scale.x, y: scale.y, z: scale.z },
          })
        );

        console.log('[calibrated-anchor] Anchor saved to localStorage:', storageKey);

        // Attach to scene and store reference
        sceneEl.object3D.attach(this.el.object3D);
        this.anchor = anchor;
        this.scale = { x: scale.x, y: scale.y, z: scale.z };

        // Emit event to notify that anchor was created successfully
        this.el.emit('anchor-created', {
          persistentHandle: persistentHandle,
          scale: this.scale,
        });
        console.log('[calibrated-anchor] Emitted anchor-created event');
      });
    },

    /**
     * Delete the current anchor and remove from localStorage.
     */
    deleteAnchor: function () {
      const anchor = this.anchor;
      const storageKey = 'anchor-' + this.data.storageKey;

      if (!anchor) {
        console.log('[calibrated-anchor] No anchor to delete');
        return;
      }

      const xrManager = this.el.sceneEl.renderer.xr;
      const session = xrManager.getSession();

      anchor.delete();
      this.anchor = undefined;

      this.el.sceneEl.object3D.add(this.el.object3D);

      if (this.persistentHandle && session) {
        session.deletePersistentAnchor(this.persistentHandle);
      }
      this.persistentHandle = undefined;

      localStorage.removeItem(storageKey);
      console.log('[calibrated-anchor] Anchor deleted, localStorage cleared:', storageKey);
    },

    /**
     * Check if anchor is active
     */
    isAnchored: function () {
      return !!this.anchor;
    },

    /**
     * Get the persistent handle UUID
     */
    getPersistentHandle: function () {
      return this.persistentHandle;
    },

    tick: function () {
      const sceneEl = this.el.sceneEl;
      const xrManager = sceneEl.renderer.xr;
      const object3D = this.el.object3D;

      if (!sceneEl.is('ar-mode') && !sceneEl.is('vr-mode')) {
        return;
      }
      if (!this.anchor) {
        return;
      }

      const frame = sceneEl.frame;
      if (!frame) return;

      const refSpace = xrManager.getReferenceSpace();
      const pose = frame.getPose(this.anchor.anchorSpace, refSpace);

      if (pose) {
        object3D.matrix.elements = pose.transform.matrix;
        object3D.matrix.decompose(object3D.position, object3D.rotation, object3D.scale);
        // Reapply stored scale (anchors don't preserve scale)
        object3D.scale.set(this.scale.x, this.scale.y, this.scale.z);
      }
    },

    remove: function () {
      this.el.sceneEl.removeEventListener('enter-vr', this.onEnterVR);
    },
  });

  componentRegistered = true;
  console.log('[calibrated-anchor] Component registered');
}

export {};

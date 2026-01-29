/**
 * Wall Manipulator A-Frame Component
 *
 * Two-handed grab/scale/rotate for wall positioning during calibration.
 * Attach to an entity that wraps the wall model.
 *
 * Usage:
 * <a-entity
 *   id="wall-container"
 *   wall-manipulator="leftController: #leftController; rightController: #rightController">
 *   <a-entity id="garage" gltf-model="..."></a-entity>
 * </a-entity>
 *
 * Controls:
 * - Left trigger alone: Drag wall to follow controller
 * - Both triggers: Scale (spread/pinch) + Rotate (twist) + Move (translate)
 *
 * @ported-from peaked/src/app/pages/playground/playground-calibrate/wall-manipulator.ts
 */

declare const AFRAME: any;

export function registerWallManipulatorComponent(): void {
  if (typeof AFRAME === 'undefined') {
    console.warn('[wall-manipulator] AFRAME not available, skipping registration');
    return;
  }

  if (AFRAME.components['wall-manipulator']) {
    console.log('[wall-manipulator] Already registered, skipping');
    return;
  }

  const THREE = AFRAME.THREE;

  console.log('[wall-manipulator] Registering component');

  AFRAME.registerComponent('wall-manipulator', {
    schema: {
      enabled: { type: 'boolean', default: true },
      leftController: { type: 'selector', default: '#leftController' },
      rightController: { type: 'selector', default: '#rightController' },
      scaleSpeed: { type: 'number', default: 1.0 },
      rotateSpeed: { type: 'number', default: 1.0 },
      minScale: { type: 'number', default: 0.1 },
      maxScale: { type: 'number', default: 5.0 },
    },

    init: function () {
      // Grip state
      this.leftGripping = false;
      this.rightGripping = false;
      this.isManipulating = false;

      // Drag state (left trigger only)
      this.isDragging = false;
      this.dragOffset = new THREE.Vector3();

      // Two-hand manipulation state
      this.grabStartDistance = 0;
      this.grabStartScale = 1;
      this.grabStartRotationY = 0;
      this.grabStartAngle = 0;
      this.grabStartMidpoint = new THREE.Vector3();

      // Current controller positions
      this.leftPos = new THREE.Vector3();
      this.rightPos = new THREE.Vector3();

      // Bind handlers
      this.onLeftTriggerDown = this.onLeftTriggerDown.bind(this);
      this.onLeftTriggerUp = this.onLeftTriggerUp.bind(this);
      this.onRightTriggerDown = this.onRightTriggerDown.bind(this);
      this.onRightTriggerUp = this.onRightTriggerUp.bind(this);

      // Wait for selectors to resolve then attach listeners
      setTimeout(() => this.setupListeners(), 100);

      console.log('[wall-manipulator] Initialized');
    },

    setupListeners: function () {
      const left = this.data.leftController;
      const right = this.data.rightController;

      if (left) {
        left.addEventListener('triggerdown', this.onLeftTriggerDown);
        left.addEventListener('triggerup', this.onLeftTriggerUp);
        console.log('[wall-manipulator] Left controller listeners attached');
      }

      if (right) {
        right.addEventListener('triggerdown', this.onRightTriggerDown);
        right.addEventListener('triggerup', this.onRightTriggerUp);
        console.log('[wall-manipulator] Right controller listeners attached');
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // TRIGGER HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    onLeftTriggerDown: function () {
      if (!this.data.enabled) return;
      this.leftGripping = true;

      if (!this.rightGripping) {
        // Left trigger alone - start drag
        this.startDrag();
      } else {
        // Both triggers - start manipulation
        this.checkStartManipulation();
      }
    },

    onLeftTriggerUp: function () {
      this.leftGripping = false;
      this.endDrag();
      this.endManipulation();
    },

    onRightTriggerDown: function () {
      if (!this.data.enabled) return;
      this.rightGripping = true;

      if (this.leftGripping) {
        // Left already held - switch from drag to manipulation
        this.endDrag();
        this.checkStartManipulation();
      }
    },

    onRightTriggerUp: function () {
      this.rightGripping = false;
      this.endManipulation();

      // If left still held, start dragging
      if (this.leftGripping) {
        this.startDrag();
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG (single hand)
    // ═══════════════════════════════════════════════════════════════════════════

    startDrag: function () {
      const left = this.data.leftController;
      if (left && left.object3D) {
        const controllerPos = new THREE.Vector3();
        left.object3D.getWorldPosition(controllerPos);

        // Store offset from controller to entity
        this.dragOffset.copy(this.el.object3D.position).sub(controllerPos);
        this.isDragging = true;

        console.log('[wall-manipulator] Drag started');
      }
    },

    endDrag: function () {
      if (this.isDragging) {
        this.isDragging = false;
        console.log('[wall-manipulator] Drag ended');
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // TWO-HAND MANIPULATION
    // ═══════════════════════════════════════════════════════════════════════════

    checkStartManipulation: function () {
      if (this.leftGripping && this.rightGripping && !this.isManipulating) {
        this.startManipulation();
      }
    },

    startManipulation: function () {
      this.isManipulating = true;

      // Get current controller positions
      this.updateControllerPositions();

      // Store initial state for relative calculations
      this.grabStartDistance = this.leftPos.distanceTo(this.rightPos);
      this.grabStartScale = this.el.object3D.scale.x;
      this.grabStartRotationY = this.el.object3D.rotation.y;

      // Calculate initial angle between controllers (in XZ plane)
      this.grabStartAngle = Math.atan2(
        this.rightPos.z - this.leftPos.z,
        this.rightPos.x - this.leftPos.x
      );

      // Calculate initial midpoint
      this.grabStartMidpoint.addVectors(this.leftPos, this.rightPos).multiplyScalar(0.5);

      console.log('[wall-manipulator] Manipulation started', {
        distance: this.grabStartDistance,
        scale: this.grabStartScale,
        rotation: this.grabStartRotationY,
      });
    },

    endManipulation: function () {
      if (this.isManipulating) {
        this.isManipulating = false;
        console.log('[wall-manipulator] Manipulation ended');
      }
    },

    updateControllerPositions: function () {
      const left = this.data.leftController;
      const right = this.data.rightController;

      if (left && left.object3D) {
        left.object3D.getWorldPosition(this.leftPos);
      }
      if (right && right.object3D) {
        right.object3D.getWorldPosition(this.rightPos);
      }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // TICK - Apply transformations
    // ═══════════════════════════════════════════════════════════════════════════

    tick: function () {
      if (!this.data.enabled) return;

      // Handle drag (left trigger only)
      if (this.isDragging) {
        const left = this.data.leftController;
        if (left && left.object3D) {
          const controllerPos = new THREE.Vector3();
          left.object3D.getWorldPosition(controllerPos);

          // Move entity to controller position + offset
          this.el.object3D.position.copy(controllerPos).add(this.dragOffset);
        }
        return; // Don't process two-hand manipulation while dragging
      }

      // Handle two-hand manipulation
      if (!this.isManipulating) return;

      this.updateControllerPositions();

      // SCALE: based on distance change between controllers
      const currentDistance = this.leftPos.distanceTo(this.rightPos);
      if (this.grabStartDistance > 0.01) {
        const scaleRatio = currentDistance / this.grabStartDistance;
        let newScale = this.grabStartScale * scaleRatio * this.data.scaleSpeed;

        // Clamp scale
        newScale = Math.max(this.data.minScale, Math.min(this.data.maxScale, newScale));

        this.el.object3D.scale.set(newScale, newScale, newScale);
      }

      // ROTATE: based on angle between controllers (twist motion)
      const currentAngle = Math.atan2(
        this.rightPos.z - this.leftPos.z,
        this.rightPos.x - this.leftPos.x
      );
      const angleDelta = currentAngle - this.grabStartAngle;
      this.el.object3D.rotation.y = this.grabStartRotationY - angleDelta * this.data.rotateSpeed;

      // MOVE: follow midpoint of controllers
      const currentMidpoint = new THREE.Vector3()
        .addVectors(this.leftPos, this.rightPos)
        .multiplyScalar(0.5);
      const midpointDelta = new THREE.Vector3().subVectors(
        currentMidpoint,
        this.grabStartMidpoint
      );

      // Apply movement (dampened for smooth feel)
      this.el.object3D.position.x += midpointDelta.x * 0.1;
      this.el.object3D.position.y += midpointDelta.y * 0.1;

      // Update grab start midpoint for continuous movement
      this.grabStartMidpoint.copy(currentMidpoint);
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    remove: function () {
      const left = this.data.leftController;
      const right = this.data.rightController;

      if (left) {
        left.removeEventListener('triggerdown', this.onLeftTriggerDown);
        left.removeEventListener('triggerup', this.onLeftTriggerUp);
      }

      if (right) {
        right.removeEventListener('triggerdown', this.onRightTriggerDown);
        right.removeEventListener('triggerup', this.onRightTriggerUp);
      }

      console.log('[wall-manipulator] Removed');
    },
  });
}

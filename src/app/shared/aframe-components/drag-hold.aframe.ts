/**
 * A-Frame component that makes a hold draggable along the wall surface.
 * Attaches to cursor raycaster events and updates entity position to follow intersection point.
 * 
 * Usage:
 *   entity.setAttribute('drag-hold', '');  // Enable dragging
 *   entity.removeAttribute('drag-hold');   // Disable dragging
 * 
 * The component automatically handles:
 * - Listening to mouse cursor raycaster intersections
 * - Updating entity position to intersection point on wall
 * - Visual feedback (emissive material during drag)
 */
AFRAME.registerComponent('drag-hold', {
  schema: {},

  init(): void {
    this.originalMaterial = this.el.getAttribute('material') || {};
    this.loggedNoRaycaster = false;
    this.loggedNoIntersections = false;
    this.loggedNoWall = false;
    this.hasLoggedUpdate = false;
    
    console.log('[drag-hold] init for hold', this.el.getAttribute('data-hold-id'));
    
    // Apply visual feedback - make it glow during drag
    this.el.setAttribute('material', {
      ...this.originalMaterial,
      emissive: '#ffaa00',
      emissiveIntensity: 0.5
    });

    // Get the mouse cursor entity (has the raycaster)
    this.cursor = document.querySelector('#mouseCursor');
    
    if (this.cursor) {
      console.log('[drag-hold] Found mouseCursor, will poll raycaster in tick()');
      // Get the raycaster component reference
      this.raycaster = this.cursor.components.raycaster;
      if (this.raycaster) {
        console.log('[drag-hold] Raycaster component found');
      } else {
        console.warn('[drag-hold] Raycaster component NOT found on mouseCursor');
      }
    } else {
      console.warn('drag-hold: mouseCursor entity not found');
    }
  },

  /**
   * Called on every frame. Poll the raycaster for current intersections and update position.
   */
  tick(): void {
    if (!this.raycaster) {
      if (!this.loggedNoRaycaster) {
        console.warn('[drag-hold] tick: no raycaster component');
        this.loggedNoRaycaster = true;
      }
      return;
    }

    const intersections = this.raycaster.intersections;
    if (!intersections || intersections.length === 0) {
      if (!this.loggedNoIntersections) {
        console.log('[drag-hold] tick: no intersections');
        this.loggedNoIntersections = true;
      }
      return;
    }

    // Reset the flag when we have intersections
    this.loggedNoIntersections = false;

    // Find intersection with the wall (not other holds)
    const wallIntersection = intersections.find((intersection: any) => {
      const el = intersection.object.el;
      return el && el.classList.contains('wall');
    });

    if (!wallIntersection) {
      if (!this.loggedNoWall) {
        console.log('[drag-hold] tick: no wall intersection, intersections:', intersections.length);
        this.loggedNoWall = true;
      }
      return;
    }

    // Reset the flag when we find a wall
    this.loggedNoWall = false;

    // Update hold position to intersection point
    const point = wallIntersection.point;
    
    if (!this.hasLoggedUpdate) {
      console.log('[drag-hold] tick: updating position to', point);
      this.hasLoggedUpdate = true;
    }
    
    this.el.setAttribute('position', {
      x: point.x,
      y: point.y,
      z: point.z
    });
  },

  remove(): void {
    console.log('[drag-hold] remove called');
    // Restore original material
    this.el.setAttribute('material', this.originalMaterial);
  }
});

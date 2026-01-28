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
    this.onRaycasterIntersection = this.onRaycasterIntersection.bind(this);
    this.originalMaterial = this.el.getAttribute('material') || {};
    
    // Apply visual feedback - make it glow during drag
    this.el.setAttribute('material', {
      ...this.originalMaterial,
      emissive: '#ffaa00',
      emissiveIntensity: 0.5
    });

    // Get the mouse cursor entity (has the raycaster)
    this.cursor = document.querySelector('#mouse-cursor');
    
    if (this.cursor) {
      // Listen to raycaster intersection events
      this.cursor.addEventListener('raycaster-intersection', this.onRaycasterIntersection);
    } else {
      console.warn('drag-hold: mouse-cursor entity not found');
    }
  },

  /**
   * Handle raycaster intersection events from the mouse cursor.
   * Updates this hold's position to the intersection point on the wall.
   */
  onRaycasterIntersection(event: CustomEvent): void {
    const intersections = event.detail.intersections;
    
    if (!intersections || intersections.length === 0) {
      return;
    }

    // Find intersection with the wall (not other holds)
    const wallIntersection = intersections.find((intersection: any) => {
      const el = intersection.object.el;
      return el && el.classList.contains('wall');
    });

    if (!wallIntersection) {
      return;
    }

    // Update hold position to intersection point
    const point = wallIntersection.point;
    this.el.setAttribute('position', {
      x: point.x,
      y: point.y,
      z: point.z
    });
  },

  remove(): void {
    // Restore original material
    this.el.setAttribute('material', this.originalMaterial);

    // Clean up event listener
    if (this.cursor) {
      this.cursor.removeEventListener('raycaster-intersection', this.onRaycasterIntersection);
    }
  }
});

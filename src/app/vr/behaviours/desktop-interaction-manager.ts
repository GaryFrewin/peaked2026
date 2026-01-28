/**
 * Desktop Interaction Manager - A-Frame Component
 *
 * Captures mouse events (click, mouseenter, mouseleave) on interactable elements
 * within its subtree and logs them for debugging/development.
 *
 * Eventually this will emit to InteractionBus, but for now just logs.
 *
 * Usage:
 * <a-entity desktop-interaction-manager>
 *   <a-sphere class="hold" data-hold-id="42"></a-sphere>
 *   <a-entity class="wall" id="garage"></a-entity>
 * </a-entity>
 *
 * Recognized classes:
 * - .hold - Climbing hold (requires data-hold-id attribute)
 * - .wall - Wall surface (captures intersection point)
 *
 * @created 2026-01-28
 */

declare const AFRAME: any;

let registered = false;

export function registerDesktopInteractionManager(): void {
  if (typeof AFRAME === 'undefined') {
    console.warn('[desktop-interaction-manager] AFRAME not available, skipping registration');
    return;
  }

  if (registered || AFRAME.components['desktop-interaction-manager']) {
    console.log('[desktop-interaction-manager] Already registered, skipping');
    return;
  }

  console.log('[desktop-interaction-manager] Registering component');

  AFRAME.registerComponent('desktop-interaction-manager', {
    schema: {
      debug: { type: 'boolean', default: true },
    },

    init: function () {
      this.log('Initializing desktop-interaction-manager');

      // Click-vs-drag logic state
      this.pointerDownDistance = null;
      this.pointerDownTarget = null;
      this.threshold = 0.001; 

      // Bind handlers
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);

      // Listen for mouse events for click-vs-drag
      this.el.addEventListener('mousedown', this.onMouseDown);
      this.el.addEventListener('mouseup', this.onMouseUp);
      this.el.addEventListener('mouseenter', this.onMouseEnter);
      this.el.addEventListener('mouseleave', this.onMouseLeave);
    },

    remove: function () {
      this.el.removeEventListener('mousedown', this.onMouseDown);
      this.el.removeEventListener('mouseup', this.onMouseUp);
      this.el.removeEventListener('mouseenter', this.onMouseEnter);
      this.el.removeEventListener('mouseleave', this.onMouseLeave);
    },


    onMouseDown: function (event: any) {
      console.log('[desktop-interaction-manager] Mouse down event:', event.detail.intersection);
      this.pointerDownDistance = event.detail.intersection.distance;
      this.pointerDownTarget = event.target;
    },

    onMouseUp: function (event: any) {
      console.log('[desktop-interaction-manager] Mouse up event:', event.detail.intersection);
      if (this.pointerDownDistance === null) return;
      const delta = event.detail.intersection.distance - this.pointerDownDistance;
      const target = event.target;

      const hasDragged  = (
        delta != 0 &&
        target === this.pointerDownTarget
      )
      console.log('[desktop-interaction-manager] has dragged:', hasDragged, 'delta:', delta);


      // Only treat as click if movement is within threshold, and same target
      if (
        !hasDragged
      ) {
        // Check what was clicked
        if (target.classList.contains('hold')) {
          this.handleHoldClick(target, event);
        } else if (target.classList.contains('wall')) {
          this.handleWallClick(target, event);
        }
      }
      this.pointerDownDistance = null;
      this.pointerDownTarget = null;
    },

    onMouseEnter: function (event: any) {
      const target = event.target;
      if (!target) return;

      if (target.classList.contains('hold')) {
        this.handleHoldHover(target, true);
      }
    },

    onMouseLeave: function (event: any) {
      const target = event.target;
      if (!target) return;

      if (target.classList.contains('hold')) {
        this.handleHoldHover(target, false);
      }
    },

    handleHoldClick: function (target: HTMLElement, event: any) {
      const holdIdStr = target.getAttribute('data-hold-id');
      const holdId = holdIdStr ? parseInt(holdIdStr, 10) : null;

      if (holdId === null || isNaN(holdId)) {
        this.log('Hold clicked but no valid data-hold-id found');
        return;
      }

      const eventData = {
        holdId,
        position: this.getPosition(target),
        intersection: event.detail?.intersection?.point || null,
      };

      this.log('holdClicked', eventData);

      // Emit to InteractionBus
      (window as any).peakedBus?.emitHoldClicked(holdId);
    },

    handleHoldHover: function (target: HTMLElement, entered: boolean) {
      const holdIdStr = target.getAttribute('data-hold-id');
      const holdId = holdIdStr ? parseInt(holdIdStr, 10) : null;

      if (holdId === null || isNaN(holdId)) {
        return;
      }

      const eventData = { holdId };

      if (entered) {
        this.log('holdHovered', eventData);
        (window as any).peakedBus?.emitHoldHovered(holdId);
      } else {
        this.log('holdUnhovered', eventData);
        (window as any).peakedBus?.emitHoldUnhovered(holdId);
      }
    },

    handleWallClick: function (target: HTMLElement, event: any) {
      const intersection = event.detail?.intersection;
      const point = intersection?.point || null;

      const eventData = {
        entityId: target.id || null,
        point: point ? { x: point.x, y: point.y, z: point.z } : null,
      };

      // Only log if we have a point (meaningful click location)
      if (point) {
        this.log('wallClicked', eventData);
        (window as any).peakedBus?.emitWallClicked(eventData.point);
      } else {
        this.log('wallClicked (no intersection point)', eventData);
      }
    },

    getPosition: function (el: HTMLElement): { x: number; y: number; z: number } | null {
      const pos = el.getAttribute('position') as any;
      if (!pos) return null;

      // A-Frame stores position as an object when accessed via getAttribute
      if (typeof pos === 'object' && pos !== null) {
        return { x: pos.x, y: pos.y, z: pos.z };
      }

      // Parse string format "x y z"
      const parts = String(pos).split(' ').map(Number);
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        return { x: parts[0], y: parts[1], z: parts[2] };
      }

      return null;
    },

    log: function (message: string, data?: any) {
      if (!this.data.debug) return;

      if (data) {
        console.log(`[desktop-interaction-manager] ${message}`, data);
      } else {
        console.log(`[desktop-interaction-manager] ${message}`);
      }
    },
  });

  registered = true;
}

export function unregisterDesktopInteractionManager(): void {
  // Note: AFRAME doesn't support unregistering components,
  // but we track our registration state for testing purposes
  registered = false;
}

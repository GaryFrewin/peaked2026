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
      this.holdPressTimerId = null;
      this.pressState = null;
      this.mouseButton = null; // Track which button was pressed (0=left, 2=right)

      // Double-click detection state
      this.lastClickTime = null;
      this.lastClickedHoldId = null;
      this.doubleClickThreshold = 300; // milliseconds

      // Bind handlers
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.onContextMenu = this.onContextMenu.bind(this);
      this.onNativeMouseDown = this.onNativeMouseDown.bind(this);

      // Listen for NATIVE mousedown to capture button info (A-Frame events don't have it)
      const canvas = this.el.sceneEl?.canvas;
      if (canvas) {
        canvas.addEventListener('mousedown', this.onNativeMouseDown, true);
      }

      // Listen for mouse events for click-vs-drag
      this.el.addEventListener('mousedown', this.onMouseDown);
      this.el.addEventListener('mouseup', this.onMouseUp);
      this.el.addEventListener('mousemove', this.onMouseMove);
      this.el.addEventListener('mouseenter', this.onMouseEnter);
      this.el.addEventListener('mouseleave', this.onMouseLeave);
      this.el.addEventListener('contextmenu', this.onContextMenu);
    },

    remove: function () {
      const canvas = this.el.sceneEl?.canvas;
      if (canvas) {
        canvas.removeEventListener('mousedown', this.onNativeMouseDown, true);
      }

      this.el.removeEventListener('mousedown', this.onMouseDown);
      this.el.removeEventListener('mouseup', this.onMouseUp);
      this.el.removeEventListener('mousemove', this.onMouseMove);
      this.el.removeEventListener('mouseenter', this.onMouseEnter);
      this.el.removeEventListener('mouseleave', this.onMouseLeave);
      this.el.removeEventListener('contextmenu', this.onContextMenu);
    },

    onNativeMouseDown: function (event: any) {
      // Capture the native mouse button (0=left, 1=middle, 2=right)
      this.mouseButton = event.button;
    },


    onMouseDown: function (event: any) {
      const intersection = event.detail?.intersection;
      console.log('[desktop-interaction-manager] Mouse down event:', intersection);
      if (intersection) {
        this.pointerDownDistance = intersection.distance;
      }
      this.pointerDownTarget = event.target;

      const holdTarget = this.getHoldTarget(event);
      if (!holdTarget) return;

      const holdId = this.getHoldId(holdTarget);
      if (holdId === null) return;

      this.clearHoldPressTimer();
      this.pressState = {
        target: holdTarget,
        holdId,
        dragging: false,
      };

      // if mouse down on hold for 500ms, we want to initialise dragging
      // - emit an event to the InteractionBus to start dragging
      this.holdPressTimerId = window.setTimeout(() => {
        if (!this.pressState || this.pressState.target !== holdTarget) return;
        this.pressState.dragging = true;
        this.log('holdDragStarted', { holdId });
        (window as any).peakedBus?.emitHoldDragStarted?.(holdId);
      }, 500);
    },

    onMouseUp: function (event: any) {
      const intersection = event.detail?.intersection;
      console.log('[desktop-interaction-manager] Mouse up event:', intersection);
      if (this.pointerDownDistance === null) return;
      
      // Use the native mouse button we captured in onNativeMouseDown
      // (undefined = left for backward compatibility with tests)
      const isLeftClick = this.mouseButton === null || this.mouseButton === undefined || this.mouseButton === 0;
      const isRightClick = this.mouseButton === 2;
      const delta = intersection ? intersection.distance - this.pointerDownDistance : 0;
      const target = event.target;

      const hasDragged = delta !== 0;
      console.log('[desktop-interaction-manager] has dragged:', hasDragged, 'delta:', delta, 'button:', this.mouseButton);

      if (this.pressState?.dragging) {
        const holdId = this.pressState.holdId;
        this.log('holdDragEnded', { holdId });
        (window as any).peakedBus?.emitHoldDragEnded?.(holdId);
      }

      // Handle RIGHT-click (cycle hold type)
      if (
        isRightClick &&
        !hasDragged &&
        !this.pressState?.dragging
      ) {
        console.log('[desktop-interaction-manager] RIGHT CLICK DETECTED!', target);
        // Check what was right-clicked
        if (target.classList.contains('hold')) {
          const holdIdStr = target.getAttribute('data-hold-id');
          const holdId = holdIdStr ? parseInt(holdIdStr, 10) : null;

          if (holdId !== null && !isNaN(holdId)) {
            this.log('holdRightClicked', { holdId });
            console.log('[desktop-interaction-manager] Emitting holdRightClicked for hold:', holdId);
            (window as any).peakedBus?.emitHoldRightClicked(holdId);
          }
        }
      }

      // Handle LEFT-click (toggle route membership, select, etc)
      if (
        isLeftClick &&
        !hasDragged &&
        !this.pressState?.dragging
      ) {
        // Check what was clicked
        if (target.classList.contains('hold')) {
          this.handleHoldClick(target, event);
        } else if (target.classList.contains('wall')) {
          this.handleWallClick(target, event);
        }
      }
      
      // Reset button tracking
      this.mouseButton = null;
      this.pointerDownDistance = null;
      this.pointerDownTarget = null;
      this.clearHoldPressTimer();
      this.pressState = null;
    },

    onMouseMove: function (event: any) {
      if (!this.pressState?.dragging) return;

      const intersection = event.detail?.intersection;
      if (!intersection) return;

      const point = intersection.point;
      if (!point) return;

      this.log('holdDragUpdated', { holdId: this.pressState.holdId, point });
      (window as any).peakedBus?.emitHoldDragUpdated?.(this.pressState.holdId, point);
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
      
      // Don't cancel the hold press timer if we're in the middle of a potential drag
      // (mouse button is still down). The timer should continue so dragging can start.
      if (this.pointerDownDistance === null) {
        this.clearHoldPressTimer();
      }
    },

    onContextMenu: function (event: any) {
      console.log('[desktop-interaction-manager] onContextMenu fired', event.target);
      
      // Prevent browser context menu immediately
      event.preventDefault();
      event.stopPropagation();

      const target = event.target;
      if (!target || !target.classList.contains('hold')) {
        console.log('[desktop-interaction-manager] contextmenu target not a hold:', target?.classList);
        return;
      }

      const holdIdStr = target.getAttribute('data-hold-id');
      const holdId = holdIdStr ? parseInt(holdIdStr, 10) : null;

      if (holdId === null || isNaN(holdId)) {
        this.log('Hold right-clicked but no valid data-hold-id found');
        return;
      }

      this.log('holdRightClicked', { holdId });
      (window as any).peakedBus?.emitHoldRightClicked(holdId);
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

      // Double-click detection
      const now = Date.now();
      const isDoubleClick =
        this.lastClickedHoldId === holdId &&
        this.lastClickTime !== null &&
        now - this.lastClickTime < this.doubleClickThreshold;

      if (isDoubleClick) {
        this.log('holdDoubleClicked', { holdId });
        (window as any).peakedBus?.emitHoldDoubleClicked(holdId);
        // Reset tracking after double-click
        this.lastClickTime = null;
        this.lastClickedHoldId = null;
      } else {
        // Update tracking for next potential double-click
        this.lastClickTime = now;
        this.lastClickedHoldId = holdId;
      }
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

    getHoldTarget: function (event: any): HTMLElement | null {
      const target = event.target as HTMLElement | null;
      if (!target) return null;
      if (target.classList?.contains('hold')) return target;
      return target.closest?.('.hold') || null;
    },

    getHoldId: function (target: HTMLElement): number | null {
      const holdIdStr = target.getAttribute('data-hold-id');
      const holdId = holdIdStr ? parseInt(holdIdStr, 10) : null;
      if (holdId === null || isNaN(holdId)) return null;
      return holdId;
    },

    clearHoldPressTimer: function () {
      if (this.holdPressTimerId !== null) {
        clearTimeout(this.holdPressTimerId);
        this.holdPressTimerId = null;
      }
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

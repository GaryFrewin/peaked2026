/**
 * VR Button A-Frame Component
 *
 * Adds hover effect and click handling for VR controllers.
 *
 * Usage:
 * <a-entity vr-button>
 *   <a-plane id="xxx-bg" color="#238636" class="clickable"></a-plane>
 *   <a-text value="Button Text"></a-text>
 * </a-entity>
 *
 * The component expects a child plane with "-bg" suffix in its ID for hover coloring.
 * Emits 'vr-button-click' event when triggered.
 *
 * IMPORTANT: This component checks if its parent panel is visible before responding
 * to interactions. This prevents stacked/hidden buttons from firing.
 *
 * @ported-from peaked/src/app/pages/playground/playground-calibrate/vr-button.ts
 */

declare const AFRAME: any;

export function registerVrButtonComponent(): void {
  if (typeof AFRAME === 'undefined') {
    console.warn('[vr-button] AFRAME not available, skipping registration');
    return;
  }

  if (AFRAME.components['vr-button']) {
    console.log('[vr-button] Already registered, skipping');
    return;
  }

  console.log('[vr-button] Registering component');

  AFRAME.registerComponent('vr-button', {
    schema: {
      hoverColor: { type: 'color', default: '#2ea043' },
      activeColor: { type: 'color', default: '#1a7f37' },
    },

    init: function () {
      this.isHovered = false;
      this.isPressed = false;
      this.baseColor = null;
      this.buttonBg = null;
      this.clickCooldown = false;
      this.activeRaycaster = null;

      const buttonId = this.el.id || 'unnamed';
      console.log(`[vr-button:${buttonId}] Initializing`);

      // Find the button background plane (child with -bg suffix)
      const children = this.el.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.id && child.id.endsWith('-bg')) {
          this.buttonBg = child;
          this.baseColor = child.getAttribute('color') || '#238636';
          console.log(`[vr-button:${buttonId}] Found background: ${child.id}`);
          break;
        }
      }

      if (!this.buttonBg) {
        console.warn(
          `[vr-button:${buttonId}] No background plane found with -bg suffix ID`
        );
        return;
      }

      // Bind event handlers
      this.onIntersection = this.onIntersection.bind(this);
      this.onIntersectionCleared = this.onIntersectionCleared.bind(this);
      this.onTriggerDown = this.onTriggerDown.bind(this);
      this.onTriggerUp = this.onTriggerUp.bind(this);

      // Listen for raycaster events on the background
      this.buttonBg.addEventListener(
        'raycaster-intersected',
        this.onIntersection
      );
      this.buttonBg.addEventListener(
        'raycaster-intersected-cleared',
        this.onIntersectionCleared
      );

      console.log(`[vr-button:${buttonId}] Init complete`);
    },

    /**
     * Check if this button is actually visible (including parent visibility)
     * This is critical because A-Frame raycasting still hits invisible elements!
     */
    isActuallyVisible: function (): boolean {
      let el = this.el;
      while (el) {
        // Check the object3D.visible property (most reliable)
        if (el.object3D && !el.object3D.visible) {
          return false;
        }
        // Also check the visible attribute
        const visibleAttr = el.getAttribute('visible');
        if (visibleAttr === false || visibleAttr === 'false') {
          return false;
        }
        el = el.parentElement;
      }
      return true;
    },

    onIntersection: function (evt: any) {
      const buttonId = this.el.id || 'unnamed';

      // CRITICAL: Check if we're actually visible before responding
      if (!this.isActuallyVisible()) {
        console.log(
          `[vr-button:${buttonId}] onIntersection IGNORED - not visible`
        );
        return;
      }

      console.log(`[vr-button:${buttonId}] onIntersection - raycaster hit`);

      this.isHovered = true;
      if (this.buttonBg) {
        this.buttonBg.setAttribute('color', this.data.hoverColor);
        this.el.setAttribute('scale', '1.05 1.05 1');
      }

      // Listen for trigger on the controller that's intersecting
      const raycaster = evt.detail.el;
      if (raycaster) {
        console.log(
          `[vr-button:${buttonId}] Adding trigger listeners to raycaster`
        );
        raycaster.addEventListener('triggerdown', this.onTriggerDown);
        raycaster.addEventListener('triggerup', this.onTriggerUp);
        this.activeRaycaster = raycaster;
      }
    },

    onIntersectionCleared: function (evt: any) {
      const buttonId = this.el.id || 'unnamed';
      console.log(`[vr-button:${buttonId}] onIntersectionCleared`);

      this.isHovered = false;
      this.isPressed = false;
      if (this.buttonBg) {
        this.buttonBg.setAttribute('color', this.baseColor);
        this.el.setAttribute('scale', '1 1 1');
      }

      // Remove controller listeners
      if (this.activeRaycaster) {
        this.activeRaycaster.removeEventListener(
          'triggerdown',
          this.onTriggerDown
        );
        this.activeRaycaster.removeEventListener('triggerup', this.onTriggerUp);
        this.activeRaycaster = null;
      }
    },

    onTriggerDown: function () {
      const buttonId = this.el.id || 'unnamed';

      // Double-check visibility on trigger
      if (!this.isActuallyVisible()) {
        console.log(`[vr-button:${buttonId}] onTriggerDown IGNORED - not visible`);
        return;
      }

      console.log(
        `[vr-button:${buttonId}] onTriggerDown - isHovered: ${this.isHovered}`
      );

      if (this.isHovered && this.buttonBg) {
        this.isPressed = true;
        this.buttonBg.setAttribute('color', this.data.activeColor);
        this.el.setAttribute('scale', '0.95 0.95 1');
      }
    },

    onTriggerUp: function () {
      const buttonId = this.el.id || 'unnamed';

      // Double-check visibility on trigger release
      if (!this.isActuallyVisible()) {
        console.log(`[vr-button:${buttonId}] onTriggerUp IGNORED - not visible`);
        this.isPressed = false;
        return;
      }

      console.log(
        `[vr-button:${buttonId}] onTriggerUp - isHovered: ${this.isHovered}, isPressed: ${this.isPressed}`
      );

      if (this.isHovered && this.isPressed && !this.clickCooldown) {
        // Emit click event only once
        this.clickCooldown = true;
        console.log(`[vr-button:${buttonId}] ✅ EMITTING vr-button-click`);
        this.el.emit('vr-button-click', {}, false);

        // Return to hover state
        if (this.buttonBg) {
          this.buttonBg.setAttribute('color', this.data.hoverColor);
          this.el.setAttribute('scale', '1.05 1.05 1');
        }

        // Reset cooldown after short delay
        setTimeout(() => {
          this.clickCooldown = false;
        }, 300);
      }
      this.isPressed = false;
    },

    remove: function () {
      const buttonId = this.el.id || 'unnamed';
      console.log(`[vr-button:${buttonId}] Removing component`);

      if (this.buttonBg) {
        this.buttonBg.removeEventListener(
          'raycaster-intersected',
          this.onIntersection
        );
        this.buttonBg.removeEventListener(
          'raycaster-intersected-cleared',
          this.onIntersectionCleared
        );
      }

      if (this.activeRaycaster) {
        this.activeRaycaster.removeEventListener(
          'triggerdown',
          this.onTriggerDown
        );
        this.activeRaycaster.removeEventListener('triggerup', this.onTriggerUp);
      }
    },
  });

  console.log('[vr-button] Component registered');
}

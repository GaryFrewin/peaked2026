/**
 * Mode Hold Colorizer A-Frame Component
 *
 * Changes hold container color based on app mode.
 * In CreateRoute/EditRoute modes: holds turn bright orange (#ff6600) to indicate "ready" state
 * In other modes: holds return to default green
 *
 * Usage:
 *   <a-entity mode-hold-colorizer="selector: .hold">
 *     <a-sphere class="hold"></a-sphere>
 *   </a-entity>
 *
 * Integrates with ModeStore to react to mode changes.
 *
 * @created 2026-01-28
 */

import { effect, runInInjectionContext } from '@angular/core';
import type { ModeStore, AppMode } from '../../../stores/mode.store';

// Use global AFRAME without redeclaring
const _AF = typeof AFRAME !== 'undefined' ? AFRAME : (window as any).AFRAME;

if (_AF) {
  _AF.registerComponent('mode-hold-colorizer', {
    schema: {
      selector: { type: 'string', default: '.hold' },
    },

    init: function () {
      this.cleanupEffect = null;
      this.currentMode = null;

      // Get Angular injector from window (exposed by base-scene)
      const injector = (window as any).__appInjector;
      if (!injector) {
        console.warn('[mode-hold-colorizer] Angular injector not available');
        return;
      }

      // Import ModeStore dynamically to avoid circular dependency
      import('../../../stores/mode.store').then(({ ModeStore, AppMode }) => {
        // Run effect inside Angular's injection context
        runInInjectionContext(injector, () => {
          // Get ModeStore
          const modeStore = injector.get(ModeStore);

          // Create effect that reacts to mode changes
          this.cleanupEffect = effect(() => {
            const mode = modeStore.mode();
            
            // Only update if mode actually changed
            if (this.currentMode === mode) {
              return;
            }

            this.currentMode = mode;

            // Apply color based on mode
            if (mode === AppMode.CreateRoute || mode === AppMode.EditRoute) {
              this.applyRouteReadyColor();
            } else {
              this.applyDefaultColor();
            }
          });
        });
      });
    },

    /**
     * Apply bright orange color to indicate route mode ready state
     */
    applyRouteReadyColor: function () {
      const children = this.el.querySelectorAll(this.data.selector);

      children.forEach((child: any) => {
        const currentMaterial = child.getAttribute('material') || {};
        child.setAttribute('material', {
          ...currentMaterial,
          color: '#ff6600', // Bright orange
          emissive: '#ff6600',
          emissiveIntensity: 0.4,
        });
      });
    },

    /**
     * Revert to default green color
     */
    applyDefaultColor: function () {
      const children = this.el.querySelectorAll(this.data.selector);

      children.forEach((child: any) => {
        const currentMaterial = child.getAttribute('material') || {};
        child.setAttribute('material', {
          ...currentMaterial,
          color: '#00ff00', // Default green
          emissive: '#00ff00',
          emissiveIntensity: 0.3,
        });
      });
    },

    remove: function () {
      // Cleanup Angular effect
      if (this.cleanupEffect) {
        this.cleanupEffect();
      }
    },
  });
}

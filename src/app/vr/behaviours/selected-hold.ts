/**
 * Selected Hold A-Frame Component
 *
 * Applies visual feedback (bright yellow emissive glow) to indicate a hold is selected.
 * Integrates with EditHoldStateStore to track selection state.
 *
 * Usage:
 *   <a-sphere class="hold" selected-hold="holdId: 42"></a-sphere>
 *
 * The component automatically:
 * - Subscribes to EditHoldStateStore.selectedHoldIds
 * - Applies bright yellow emissive glow when holdId is in selected set
 * - Removes glow when holdId is removed from selected set
 *
 * Visual Feedback:
 * - Bright yellow emissive color (#ffff00)
 * - High emissive intensity 1.2
 * - Scale multiplier 1.15x
 *
 * @created 2026-01-28
 */

import { effect, runInInjectionContext } from '@angular/core';
import type { EditHoldStateStore } from '../../stores/edit-hold-state.store';

// Use global AFRAME without redeclaring
const _AF = typeof AFRAME !== 'undefined' ? AFRAME : (window as any).AFRAME;

if (_AF) {
  _AF.registerComponent('selected-hold', {
    schema: {
      holdId: { type: 'int', default: -1 },
    },

    init: function () {
      this.isSelected = false;
      this.originalScale = null;
      this.originalColor = null;
      this.originalShader = null;
      this.cleanupEffect = null;

      // Get Angular injector from window (exposed by base-scene)
      const injector = (window as any).__appInjector;
      if (!injector) {
        console.warn('[selected-hold] Angular injector not available');
        return;
      }

      // Import EditHoldStateStore dynamically to avoid circular dependency
      import('../../stores/edit-hold-state.store').then(({ EditHoldStateStore }) => {
        // Run effect inside Angular's injection context
        runInInjectionContext(injector, () => {
          // Get EditHoldStateStore
          const editHoldState = injector.get(EditHoldStateStore) as EditHoldStateStore;

          // Create effect to watch selection changes
          this.cleanupEffect = effect(() => {
            const selectedIds = editHoldState.selectedHoldIds();
            const isNowSelected = selectedIds.has(this.data.holdId);

            if (isNowSelected !== this.isSelected) {
              this.isSelected = isNowSelected;
              this.updateVisuals();
            }
          });
        });
      }).catch((err) => {
        console.error('[selected-hold] Failed to load EditHoldStateStore:', err);
      });
    },

    remove: function () {
      // Clean up the effect (only if it was created)
      if (this.cleanupEffect && typeof this.cleanupEffect === 'function') {
        this.cleanupEffect();
        this.cleanupEffect = null;
      }

      // Remove selection visuals
      if (this.isSelected) {
        this.removeSelectionVisuals();
      }
    },

    /**
     * Update visual feedback based on selection state
     */
    updateVisuals: function () {
      if (this.isSelected) {
        this.applySelectionVisuals();
      } else {
        this.removeSelectionVisuals();
      }
    },

    /**
     * Apply solid rich yellow color with flat shading and scale increase
     */
    applySelectionVisuals: function () {
      // Store original values
      const currentMaterial = this.el.getAttribute('material') || {};
      const currentScale = this.el.getAttribute('scale') || { x: 1, y: 1, z: 1 };

      this.originalColor = currentMaterial.color || '#00ff00';
      this.originalShader = currentMaterial.shader || 'standard';
      this.originalScale = { ...currentScale };

      // Apply selection visuals - solid rich yellow with flat shader
      this.el.setAttribute('material', {
        ...currentMaterial,
        color: '#ffff00', // Rich yellow base color
        shader: 'flat', // Flat shading ignores lighting for solid color
      });

      // Scale up slightly
      this.el.setAttribute('scale', {
        x: currentScale.x * 1.15,
        y: currentScale.y * 1.15,
        z: currentScale.z * 1.15,
      });
    },

    /**
     * Remove selection visuals and restore originals
     */
    removeSelectionVisuals: function () {
      if (!this.originalScale) return;

      const currentMaterial = this.el.getAttribute('material') || {};

      // Restore original material
      this.el.setAttribute('material', {
        ...currentMaterial,
        color: this.originalColor,
        shader: this.originalShader,
      });

      // Restore original scale
      this.el.setAttribute('scale', this.originalScale);
    },
  });
}

/**
 * Export for registration in main.ts
 */
export function registerSelectedHold(): void {
  // Registration happens automatically via the global AFRAME check above
  console.log('[selected-hold] Component registered');
}

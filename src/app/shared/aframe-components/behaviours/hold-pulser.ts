/**
 * Hold Pulser A-Frame Component
 *
 * Continuous glow pulse on child entities via emissive intensity.
 * Uses a different property than scale, so it doesn't conflict with hover animations.
 *
 * Usage:
 *   <a-entity hold-pulser="selector: .hold; minIntensity: 0.3; maxIntensity: 1.0">
 *     <a-sphere class="hold" material="emissive: #ff6600"></a-sphere>
 *   </a-entity>
 *
 * Events:
 *   - start-pulse: Begin the continuous glow pulse
 *   - stop-pulse: Stop pulsing and reset emissive intensity
 *
 * Note: Requires holds to have an emissive color set in their material.
 */

// Use global AFRAME without redeclaring
const _AF = typeof AFRAME !== 'undefined' ? AFRAME : (window as any).AFRAME;

if (_AF) {
  _AF.registerComponent('hold-pulser', {
    schema: {
      selector: { type: 'string', default: '.hold' },
      minIntensity: { type: 'number', default: 0.2 },
      maxIntensity: { type: 'number', default: 0.9 },
      pulseDuration: { type: 'number', default: 1200 }, // Full cycle duration (ms)
      emissiveColor: { type: 'color', default: '#ff6600' }, // Orange glow
    },

    init: function () {
      this.startPulse = this.startPulse.bind(this);
      this.stopPulse = this.stopPulse.bind(this);
      this.isPulsing = false;

      this.el.addEventListener('start-pulse', this.startPulse);
      this.el.addEventListener('stop-pulse', this.stopPulse);
    },

    remove: function () {
      this.el.removeEventListener('start-pulse', this.startPulse);
      this.el.removeEventListener('stop-pulse', this.stopPulse);
      this.stopPulse();
    },

    /**
     * Start the continuous glow pulse on all matching children
     */
    startPulse: function () {
      if (this.isPulsing) return;
      this.isPulsing = true;

      const children = this.el.querySelectorAll(this.data.selector);
      if (!children.length) return;

      children.forEach((child: any) => {
        // First, ensure the hold has an emissive material
        const currentMaterial = child.getAttribute('material') || {};
        child.setAttribute('material', {
          ...currentMaterial,
          emissive: this.data.emissiveColor,
          emissiveIntensity: this.data.minIntensity,
        });

        // Add pulsing animation on emissiveIntensity
        child.setAttribute('animation__pulse', {
          property: 'material.emissiveIntensity',
          from: this.data.minIntensity,
          to: this.data.maxIntensity,
          dur: this.data.pulseDuration,
          easing: 'easeInOutSine',
          loop: true,
          dir: 'alternate',
        });
      });
    },

    /**
     * Stop pulsing and reset emissive intensity
     */
    stopPulse: function () {
      if (!this.isPulsing) return;
      this.isPulsing = false;

      const children = this.el.querySelectorAll(this.data.selector);

      children.forEach((child: any) => {
        child.removeAttribute('animation__pulse');
        
        // Reset emissive intensity to 0 (no glow)
        const currentMaterial = child.getAttribute('material') || {};
        child.setAttribute('material', {
          ...currentMaterial,
          emissiveIntensity: 0,
        });
      });
    },
  });
}

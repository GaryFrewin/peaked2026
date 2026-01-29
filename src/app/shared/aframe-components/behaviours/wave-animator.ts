/**
 * Wave Animator A-Frame Component
 *
 * One-shot "mexican wave" effect on child entities.
 * Animates scale bottom-to-top with staggered delays.
 *
 * Usage:
 *   <a-entity wave-animator="selector: .hold; waveDuration: 800">
 *     <a-sphere class="hold" position="0 0 0"></a-sphere>
 *     <a-sphere class="hold" position="0 1 0"></a-sphere>
 *   </a-entity>
 *
 * Events:
 *   - trigger-wave: Start the wave animation
 *   - stop-wave: Cancel animation and reset scale
 */

// Use global AFRAME without redeclaring
const _AFRAME = typeof AFRAME !== 'undefined' ? AFRAME : (window as any).AFRAME;

if (_AFRAME) {
  _AFRAME.registerComponent('wave-animator', {
    schema: {
      selector: { type: 'string', default: '.hold' },
      waveDuration: { type: 'number', default: 800 }, // Total wave duration (ms)
      waveScale: { type: 'number', default: 1.8 }, // Scale at peak of wave
    },

    init: function () {
      this.triggerWave = this.triggerWave.bind(this);
      this.stopWave = this.stopWave.bind(this);

      this.el.addEventListener('trigger-wave', this.triggerWave);
      this.el.addEventListener('stop-wave', this.stopWave);
    },

    remove: function () {
      this.el.removeEventListener('trigger-wave', this.triggerWave);
      this.el.removeEventListener('stop-wave', this.stopWave);
    },

    /**
     * Trigger the wave animation on all matching child entities
     */
    triggerWave: function () {
      const children = this.el.querySelectorAll(this.data.selector);
      if (!children.length) return;

      // Find Y range for delay calculation
      const positions = Array.from(children).map((child: any) => child.object3D?.position?.y ?? 0);
      const minY = Math.min(...positions);
      const maxY = Math.max(...positions);
      const yRange = maxY - minY || 1; // Avoid division by zero

      children.forEach((child: any) => {
        const y = child.object3D?.position?.y ?? 0;

        // Calculate delay: bottom (minY) starts first, top (maxY) starts last
        const normalizedY = (y - minY) / yRange;
        const delay = normalizedY * this.data.waveDuration;

        // Wave burst animation (scale up)
        child.setAttribute('animation__wave', {
          property: 'scale',
          to: { x: this.data.waveScale, y: this.data.waveScale, z: this.data.waveScale },
          dur: 150,
          easing: 'easeOutQuad',
          delay: delay,
        });

        // Wave return animation (scale back down)
        child.setAttribute('animation__waveback', {
          property: 'scale',
          from: { x: this.data.waveScale, y: this.data.waveScale, z: this.data.waveScale },
          to: { x: 1, y: 1, z: 1 },
          dur: 200,
          easing: 'easeInQuad',
          delay: delay + 150,
        });
      });
    },

    /**
     * Stop all animations and reset to original scale
     */
    stopWave: function () {
      const children = this.el.querySelectorAll(this.data.selector);

      children.forEach((child: any) => {
        child.removeAttribute('animation__wave');
        child.removeAttribute('animation__waveback');
        child.setAttribute('scale', '1 1 1');
      });
    },
  });
}

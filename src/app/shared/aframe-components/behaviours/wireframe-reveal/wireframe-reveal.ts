declare var AFRAME: any;

/**
 * Wireframe Reveal Effect
 * 
 * Replaces model materials with a wireframe shader that reveals from bottom to top.
 * Useful for dramatic "materialization" effects after alignment.
 * 
 * Usage: element.setAttribute('wireframe-reveal', 'duration: 3000; color: #00ff88');
 * Events: Emits 'wireframe-reveal-complete' when animation finishes.
 */
export function registerWireframeRevealBehaviour(): void {
  if (typeof AFRAME === 'undefined') {
    console.warn('[wireframe-reveal] AFRAME not available, skipping registration');
    return;
  }
  if (AFRAME.components['wireframe-reveal']) return;

  const THREE = AFRAME.THREE;

  AFRAME.registerComponent('wireframe-reveal', {
    schema: {
      duration: { type: 'number', default: 2000 },
      color: { type: 'color', default: '#00ff88' }
    },

    init: function () {
      this.isAnimating = false;
      this.wireframeMaterials = [] as any[];
      this.startTime = 0;
      this.minY = 0;
      this.maxY = 1;

      this.tick = AFRAME.utils.throttleTick(this.tick, 16, this);

      // Start immediately when component is added
      this.startReveal();
    },

    startReveal: function () {
      const model = this.el.getObject3D('mesh');
      if (!model) {
        console.log('[wireframe-reveal] Waiting for model...');
        this.el.addEventListener('model-loaded', () => this.startReveal(), { once: true });
        return;
      }

      console.log('[wireframe-reveal] Model found, setting up wireframe');

      // Get bounding box in WORLD space (after all transforms applied)
      const parent = this.el.parentEl;
      const targetObject = parent?.object3D || this.el.object3D;
      const worldBox = new THREE.Box3().setFromObject(targetObject);

      this.minY = worldBox.min.y;
      this.maxY = worldBox.max.y;

      console.log(`[wireframe-reveal] World bounds: minY=${this.minY.toFixed(3)}, maxY=${this.maxY.toFixed(3)}`);

      // Apply wireframe material - starts with cutoff at bottom (nothing visible)
      const color = new THREE.Color(this.data.color);

      model.traverse((child: any) => {
        if (child.isMesh) {
          const mat = new THREE.ShaderMaterial({
            uniforms: {
              color: { value: color },
              cutoffY: { value: this.minY },
              opacity: { value: 0.85 }
            },
            vertexShader: `
              varying vec3 vWorldPosition;
              
              void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPos.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              precision mediump float;
              
              uniform vec3 color;
              uniform float cutoffY;
              uniform float opacity;
              
              varying vec3 vWorldPosition;
              
              void main() {
                if (vWorldPosition.y > cutoffY) {
                  discard;
                }
                gl_FragColor = vec4(color, opacity);
              }
            `,
            transparent: true,
            wireframe: true,
            side: THREE.DoubleSide
          });

          child.material = mat;
          this.wireframeMaterials.push(mat);
        }
      });

      console.log(`[wireframe-reveal] Applied to ${this.wireframeMaterials.length} meshes, starting animation`);

      this.isAnimating = true;
      this.startTime = performance.now();
    },

    tick: function () {
      if (!this.isAnimating) return;

      const elapsed = performance.now() - this.startTime;
      const progress = Math.min(elapsed / this.data.duration, 1);

      // Ease out - starts fast, slows at end
      const eased = 1 - Math.pow(1 - progress, 2);

      // Move cutoff from bottom to top
      const currentCutoffY = this.minY + (this.maxY - this.minY) * eased;

      // Update all materials
      for (const mat of this.wireframeMaterials) {
        mat.uniforms.cutoffY.value = currentCutoffY;
      }

      if (progress >= 1) {
        this.isAnimating = false;
        console.log('[wireframe-reveal] Complete');
        this.el.emit('wireframe-reveal-complete');
      }
    }
  });
}

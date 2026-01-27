/**
 * wall-opacity A-Frame component
 * 
 * Sets the opacity of all materials in a GLTF model.
 * Used to make the wall transparent so occlusion masking can work properly.
 * 
 * Usage:
 * <a-entity gltf-model="..." wall-opacity="opacity: 0.5"></a-entity>
 */

declare var AFRAME: any;

if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('wall-opacity', {
    schema: {
      opacity: { type: 'number', default: 1.0 }
    },

    init() {
      // Wait for model to load
      this.el.addEventListener('model-loaded', () => {
        this.applyOpacity();
      });
    },

    update() {
      this.applyOpacity();
    },

    applyOpacity() {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;

      const opacity = this.data.opacity;

      mesh.traverse((node: any) => {
        if (node.material) {
          // Handle both single material and material arrays
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          
          materials.forEach((material: any) => {
            material.transparent = opacity < 1.0;
            material.opacity = opacity;
            material.needsUpdate = true;
          });
        }
      });
    }
  });
}

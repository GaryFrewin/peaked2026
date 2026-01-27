/**
 * Dynamic Skybox A-Frame Component
 * 
 * Loads/removes a GLTF skybox model based on the path set via attribute.
 * 
 * Usage:
 *   <a-entity dynamic-skybox="path: assets/skyboxes/anime_sky.glb"></a-entity>
 * 
 * The Angular component hosting this should use effect() to update the path
 * attribute when the SettingsStore.selectedSkyboxPath() changes.
 */

declare const AFRAME: any;

// Only register if A-Frame is available (not in unit tests)
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('dynamic-skybox', {
    schema: {
      path: { type: 'string', default: '' }
    },

    init: function () {
      console.log('[dynamic-skybox] Initialized');
      this.updateSkybox(this.data.path);
    },

    update: function (oldData: any) {
      if (oldData.path !== this.data.path) {
        console.log('[dynamic-skybox] Path changed:', oldData.path, '->', this.data.path);
        this.updateSkybox(this.data.path);
      }
    },

    updateSkybox: function (path: string) {
      if (path) {
        console.log('[dynamic-skybox] Loading skybox:', path);
        this.el.setAttribute('gltf-model', path);
      } else {
        console.log('[dynamic-skybox] Removing skybox');
        this.el.removeAttribute('gltf-model');
      }
    },

    remove: function () {
      console.log('[dynamic-skybox] Removed');
    }
  });
}

export {};

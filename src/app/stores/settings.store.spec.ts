import { TestBed } from '@angular/core/testing';
import { SettingsStore } from './settings.store';
import { environment } from '../../environments/environment';

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SettingsStore],
    });
    store = TestBed.inject(SettingsStore);
  });

  describe('skybox selection', () => {
    it('should default to Above Clouds skybox', () => {
      expect(store.selectedSkyboxPath()).toBe(environment.aboveClouds);
    });

    it('should return the path when a skybox is selected', () => {
      const testPath = 'assets/skyboxes/test.glb';
      store.setSkybox(testPath);
      expect(store.selectedSkyboxPath()).toBe(testPath);
    });

    it('should return empty string when None is selected', () => {
      // First set a skybox
      store.setSkybox('assets/skyboxes/test.glb');
      // Then clear it
      store.setSkybox('');
      expect(store.selectedSkyboxPath()).toBe('');
    });

    it('should never return empty path when setRandomSkybox is called', () => {
      // Run multiple times to increase confidence
      for (let i = 0; i < 10; i++) {
        store.setRandomSkybox();
        expect(store.selectedSkyboxPath()).toBeTruthy();
      }
    });
  });

  describe('skybox occlusion (view real wall through)', () => {
    it('should default to showing real wall through skybox', () => {
      expect(store.occludeSkybox()).toBe(true);
    });

    it('should hide real wall when occlusion is disabled', () => {
      store.setOccludeSkybox(false);
      expect(store.occludeSkybox()).toBe(false);
    });

    it('should show real wall when occlusion is enabled', () => {
      store.setOccludeSkybox(false);
      store.setOccludeSkybox(true);
      expect(store.occludeSkybox()).toBe(true);
    });
  });

  describe('skybox options for UI', () => {
    it('should provide skybox options with name and path', () => {
      const options = store.skyboxOptions;
      expect(options.length).toBeGreaterThan(0);
      
      // Each option should have name and path
      options.forEach(option => {
        expect(option.name).toBeDefined();
        expect(option.path).toBeDefined();
      });
    });

    it('should include a None option with empty path', () => {
      const noneOption = store.skyboxOptions.find(o => o.path === '');
      expect(noneOption).toBeDefined();
      expect(noneOption!.name).toBeTruthy();
    });
  });
});

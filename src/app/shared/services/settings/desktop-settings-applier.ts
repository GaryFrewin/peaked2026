import { effect, inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { SettingsStore } from '../../../stores/settings.store';
import { ModeStore } from '../../../stores/mode.store';
import { BaseSceneComponent } from '../../components/base-scene/base-scene';

/**
 * DESKTOP SETTINGS APPLIER
 *
 * Applies settings from SettingsStore to a BaseScene.
 * The BaseScene stays "dumb" - it doesn't know about settings.
 * This service reaches in and modifies A-Frame attributes directly.
 *
 * Usage in WallViewer:
 *   this.settingsApplier.attachTo(this.baseScene);
 */
@Injectable({ providedIn: 'root' })
export class DesktopSettingsApplier {
  private readonly settingsStore = inject(SettingsStore);
  private readonly modeStore = inject(ModeStore);
  private readonly injector = inject(Injector);

  /**
   * Attach to a BaseScene and apply settings reactively.
   * Call once after scene is ready.
   */
  attachTo(scene: BaseSceneComponent): void {
    // Run effects in injection context so they can use inject()
    runInInjectionContext(this.injector, () => {
      this.setupHoldsVisibility(scene);
      this.setupWallOpacity(scene);
      this.setupSkybox(scene);
    });
  }

  private setupHoldsVisibility(scene: BaseSceneComponent): void {
    effect(() => {
      const holdsVisible = this.settingsStore.holdsVisible();
      const inEditMode = !this.modeStore.isViewMode();
      
      // Force holds visible in any edit mode, otherwise respect settings
      const actualVisible = inEditMode || holdsVisible;
      
      const container = scene.holdsContainerRef?.nativeElement;
      if (container) {
        container.setAttribute('visible', String(actualVisible));
      }
    });
  }

  private setupWallOpacity(scene: BaseSceneComponent): void {
    effect(() => {
      const opacity = this.settingsStore.wallOpacity();
      
      // Find wall container and apply opacity
      const sceneEl = scene.sceneElement?.nativeElement;
      const wallContainer = sceneEl?.querySelector('#wall-container');
      if (wallContainer) {
        wallContainer.setAttribute('wall-opacity', `opacity: ${opacity}`);
      }
    });
  }

  private setupSkybox(scene: BaseSceneComponent): void {
    effect(() => {
      const skyboxPath = this.settingsStore.selectedSkyboxPath();
      
      const sceneEl = scene.sceneElement?.nativeElement;
      const sky = sceneEl?.querySelector('a-sky');
      if (sky) {
        sky.setAttribute('visible', String(skyboxPath !== ''));
      }
    });
  }
}

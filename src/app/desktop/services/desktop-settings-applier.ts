import { effect, inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { SettingsStore } from '../../stores/settings.store';
import { ModeStore, AppMode } from '../../stores/mode.store';
import { BaseSceneComponent } from '../../shared/components/base-scene/base-scene';

/**
 * DESKTOP SETTINGS APPLIER
 *
 * Reactively syncs SettingsStore changes to A-Frame scene:
 * - Holds visibility (forced on during edit modes)
 * - Wall opacity (material transparency)
 * - Skybox visibility (based on selected background)
 * - Mode effects (wave/pulse animations when entering EditHolds)
 *
 * Uses Angular effects to watch store signals and update A-Frame DOM.
 * BaseScene stays dumb - this service manipulates its A-Frame attributes.
 *
 * Usage: this.settingsApplier.attachTo(this.baseScene);
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
      this.setupModeEffects(scene);
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

  /**
   * Apply mode-specific visual effects
   * - EditHolds: trigger wave animation, then start pulse
   * - CreateRoute/EditRoute: trigger wave animation only
   */
  private setupModeEffects(scene: BaseSceneComponent): void {
    effect(() => {
      const mode = this.modeStore.mode();
      const container = scene.holdsContainerRef?.nativeElement;
      
      if (!container) return;

      if (mode === AppMode.EditHolds) {
        // Entering edit holds mode - trigger wave, then start pulse
        container.dispatchEvent(new Event('trigger-wave'));
        // Delay pulse start until wave completes (~800ms)
        setTimeout(() => {
          container.dispatchEvent(new Event('start-pulse'));
        }, 800);
      } else if (mode === AppMode.CreateRoute || mode === AppMode.EditRoute) {
        // Entering route edit mode - trigger wave only (no pulse)
        container.dispatchEvent(new Event('trigger-wave'));
      } else {
        // Leaving edit mode - stop everything
        container.dispatchEvent(new Event('stop-wave'));
        container.dispatchEvent(new Event('stop-pulse'));
      }
    });
  }
}

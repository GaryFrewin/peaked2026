import { effect, inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { SettingsStore } from '../../stores/settings.store';
import { BaseSceneComponent } from '../../shared/components/base-scene/base-scene';

/**
 * VR SETTINGS APPLIER
 *
 * Reactively syncs SettingsStore changes to A-Frame scene in VR mode:
 * - Holds visibility (show/hide all holds)
 * - Wall opacity (material transparency via wall-opacity component)
 *
 * Uses Angular effects to watch store signals and update A-Frame DOM.
 * BaseScene stays dumb - this service manipulates its A-Frame attributes.
 *
 * Note: Unlike DesktopSettingsApplier, this does NOT handle mode effects
 * since VR is currently view-only (no edit modes).
 *
 * Usage: this.settingsApplier.attachTo(this.baseScene);
 */
@Injectable({ providedIn: 'root' })
export class VrSettingsApplier {
  private readonly settingsStore = inject(SettingsStore);
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
    });
  }

  private setupHoldsVisibility(scene: BaseSceneComponent): void {
    effect(() => {
      const holdsVisible = this.settingsStore.holdsVisible();
      
      const container = scene.holdsContainerRef?.nativeElement;
      if (container) {
        container.setAttribute('visible', String(holdsVisible));
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
}

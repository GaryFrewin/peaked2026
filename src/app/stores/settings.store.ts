import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface SkyboxOption {
  name: string;
  key: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  // Skybox options for UI dropdown
  readonly skyboxOptions: SkyboxOption[] = [
    { name: 'None', key: 'none', path: '' },
    { name: 'Anime Sky', key: 'animeSky', path: environment.animeSkySkybox ?? '' },
    { name: 'Forest', key: 'forest', path: environment.forestClearing ?? '' },
    { name: 'Above Clouds', key: 'aboveClouds', path: environment.aboveClouds ?? '' },
    { name: 'Northern Lights', key: 'northernLights', path: environment.northernLights ?? '' },
  ];

  // Default to Above Clouds skybox
  private readonly defaultSkybox = environment.aboveClouds ?? '';

  // ========== SIGNALS (State) ==========

  /** Selected skybox path - defaults to Above Clouds */
  readonly selectedSkyboxPath = signal<string>(this.defaultSkybox);

  /** Occlude skybox - when true, real wall is visible through skybox */
  readonly occludeSkybox = signal<boolean>(true);

  /** Wall opacity - 0 = fully transparent (default for occlusion to work), 1 = fully opaque */
  readonly wallOpacity = signal<number>(0);

  /** Whether non-route holds are visible */
  readonly holdsVisible = signal<boolean>(false);

  // ========== ACTIONS ==========

  setSkybox(path: string): void {
    this.selectedSkyboxPath.set(path);
  }

  setRandomSkybox(): void {
    const nonEmptyOptions = this.skyboxOptions.filter(o => o.path !== '');
    if (nonEmptyOptions.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * nonEmptyOptions.length);
    this.selectedSkyboxPath.set(nonEmptyOptions[randomIndex].path);
  }

  setOccludeSkybox(occlude: boolean): void {
    this.occludeSkybox.set(occlude);
  }

  setWallOpacity(opacity: number): void {
    // Clamp between 0 and 1
    this.wallOpacity.set(Math.max(0, Math.min(1, opacity)));
  }

  setHoldsVisible(visible: boolean): void {
    this.holdsVisible.set(visible);
  }
}

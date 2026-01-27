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

  // Selected skybox path - defaults to Above Clouds
  private readonly _selectedSkyboxPath = signal<string>(this.defaultSkybox);
  readonly selectedSkyboxPath = this._selectedSkyboxPath.asReadonly();

  // Occlude skybox - when true, real wall is visible through skybox
  private readonly _occludeSkybox = signal<boolean>(true);
  readonly occludeSkybox = this._occludeSkybox.asReadonly();

  // Wall opacity - 0 = fully transparent (default for occlusion to work), 1 = fully opaque
  private readonly _wallOpacity = signal<number>(0);
  readonly wallOpacity = this._wallOpacity.asReadonly();

  setSkybox(path: string): void {
    this._selectedSkyboxPath.set(path);
  }

  setRandomSkybox(): void {
    const nonEmptyOptions = this.skyboxOptions.filter(o => o.path !== '');
    if (nonEmptyOptions.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * nonEmptyOptions.length);
    this._selectedSkyboxPath.set(nonEmptyOptions[randomIndex].path);
  }

  setOccludeSkybox(occlude: boolean): void {
    this._occludeSkybox.set(occlude);
  }

  setWallOpacity(opacity: number): void {
    // Clamp between 0 and 1
    this._wallOpacity.set(Math.max(0, Math.min(1, opacity)));
  }
}

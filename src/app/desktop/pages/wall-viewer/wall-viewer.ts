import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { BaseSceneComponent } from '../../../shared/components/base-scene/base-scene';

// Register desktop-specific A-Frame behaviors
import '../../../vr/behaviours/desktop-interaction-manager';
import '../../../vr/behaviours/wave-animator';
import '../../../vr/behaviours/hold-pulser';
import { registerDesktopInteractionManager } from '../../../vr/behaviours/desktop-interaction-manager';
registerDesktopInteractionManager();

import { WallStore } from '../../../stores/wall.store';
import { HoldStore } from '../../../stores/hold.store';
import { RouteStore } from '../../../stores/route.store';
import { RouteListComponent } from '../../components/route-list/route-list';
import { EditorToolbarComponent } from '../../components/editor-toolbar/editor-toolbar.component';
import { SettingsPanelComponent } from '../../../shared/components/settings-panel/settings-panel.component';
import { DesktopSettingsApplier } from '../../../shared/services/settings/desktop-settings-applier';

@Component({
  selector: 'app-wall-viewer',
  standalone: true,
  imports: [BaseSceneComponent, RouteListComponent, EditorToolbarComponent, SettingsPanelComponent],
  templateUrl: './wall-viewer.html',
  styleUrl: './wall-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WallViewerComponent implements OnInit {
  @ViewChild(BaseSceneComponent) baseScene!: BaseSceneComponent;
  
  protected readonly wallStore = inject(WallStore);
  protected readonly holdStore = inject(HoldStore);
  protected readonly routeStore = inject(RouteStore);
  private readonly settingsApplier = inject(DesktopSettingsApplier);

  private readonly sceneReady = signal(false);
  protected readonly settingsOpen = signal(false);

  constructor() {
    // Effect to auto-select first wall when walls load AND scene is ready
    effect(() => {
      const walls = this.wallStore.walls();
      const isSceneReady = this.sceneReady();
      const alreadySelected = this.wallStore.selectedWall();
      const modelPath = this.wallStore.modelPath();

      console.log('WallViewer effect:', {
        wallsCount: walls.length,
        isSceneReady,
        alreadySelected: !!alreadySelected,
        selectedWallName: alreadySelected?.name,
        modelPath
      });

      // Only auto-select when: walls loaded, scene ready, nothing selected yet
      if (walls.length > 0 && isSceneReady && !alreadySelected) {
        console.log('Auto-selecting first wall:', walls[0].name);
        this.wallStore.selectWall(walls[0].id);
        
        if (walls[0].wall_versions.length > 0) {
          // Select the latest version (last in array)
          const versions = walls[0].wall_versions;
          const version = versions[versions.length - 1];
          console.log('Auto-selecting latest version:', version.id, 'model_path:', version.model_path);
          this.wallStore.selectVersion(version.id);
          this.holdStore.loadHolds(String(walls[0].id), String(version.id));
          // Also load routes for this wall/version
          this.routeStore.loadRoutes(walls[0].id, version.id);
        }
      }
    });
  }

  ngOnInit(): void {
    console.log('WallViewer ngOnInit - current walls:', this.wallStore.walls().length);
    
    // Load walls if not already loaded
    if (this.wallStore.walls().length === 0) {
      console.log('WallViewer: Loading walls...');
      this.wallStore.loadWalls();
    } else {
      console.log('WallViewer: Walls already loaded, count:', this.wallStore.walls().length);
      // If walls exist but none selected, we need to trigger selection
      // The effect will handle this when sceneReady becomes true
    }
  }

  onSceneReady(): void {
    console.log('Desktop scene ready - setting sceneReady signal');
    this.sceneReady.set(true);
    
    // Attach settings applier to manage scene settings reactively
    this.settingsApplier.attachTo(this.baseScene);
    
    // Attach desktop-specific interaction manager to wall-environment
    this.attachDesktopInteractionManager();
  }

  private attachDesktopInteractionManager(): void {
    const wallEnvironment = this.baseScene.sceneElement.nativeElement.querySelector('#wall-environment');
    if (wallEnvironment) {
      wallEnvironment.setAttribute('desktop-interaction-manager', '');
      console.log('Desktop interaction manager attached to wall-environment');
    } else {
      console.warn('wall-environment entity not found for desktop interaction manager');
    }
  }

  onToolSelected(toolId: string): void {
    if (toolId === 'settings') {
      this.settingsOpen.update(open => !open);
    }
  }
}

import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { BaseSceneComponent } from '../../../shared/components/base-scene/base-scene';
import { WallStore } from '../../../stores/wall.store';
import { HoldStore } from '../../../stores/hold.store';
import { RouteStore } from '../../../stores/route.store';
import { SettingsStore } from '../../../stores/settings.store';
import { VrRouteListComponent } from '../../components/vr-route-list/vr-route-list';
import { SettingsPanelComponent } from '../../../shared/components/settings-panel/settings-panel.component';
import { VrSettingsApplier } from '../../services/vr-settings-applier';

// Register A-Frame behaviours
import '../../behaviours';

@Component({
  selector: 'app-vr-climbing',
  standalone: true,
  imports: [BaseSceneComponent, VrRouteListComponent, SettingsPanelComponent],
  templateUrl: './vr-climbing.html',
  styleUrl: './vr-climbing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VrClimbingComponent implements OnInit {
  @ViewChild(BaseSceneComponent) baseScene!: BaseSceneComponent;
  
  protected readonly wallStore = inject(WallStore);
  protected readonly holdStore = inject(HoldStore);
  protected readonly routeStore = inject(RouteStore);
  protected readonly settingsStore = inject(SettingsStore);
  private readonly settingsApplier = inject(VrSettingsApplier);

  private readonly sceneReady = signal(false);

  constructor() {
    // Effect to auto-select first wall when walls load AND scene is ready
    effect(() => {
      const walls = this.wallStore.walls();
      const isSceneReady = this.sceneReady();
      const alreadySelected = this.wallStore.selectedWall();

      // Only auto-select when: walls loaded, scene ready, nothing selected yet
      if (walls.length > 0 && isSceneReady && !alreadySelected) {
        console.log('VR: Auto-selecting first wall:', walls[0].name);
        this.wallStore.selectWall(walls[0].id);
        
        if (walls[0].wall_versions.length > 0) {
          // Select the latest version (last in array)
          const versions = walls[0].wall_versions;
          const version = versions[versions.length - 1];
          console.log('VR: Auto-selecting latest version:', version.id, 'model_path:', version.model_path);
          this.wallStore.selectVersion(version.id);
          this.holdStore.loadHolds(String(walls[0].id), String(version.id));
          // Also load routes for this wall/version
          this.routeStore.loadRoutes(walls[0].id, version.id);
        }
      }
    });
  }

  ngOnInit(): void {
    // Load walls if not already loaded
    if (this.wallStore.walls().length === 0) {
      console.log('VrClimbing: Loading walls...');
      this.wallStore.loadWalls();
    }
  }

  onSceneReady(): void {
    console.log('VR scene ready');
    this.sceneReady.set(true);
    
    // VrSettingsApplier: Reactively applies user settings (holds visibility, wall opacity)
    // to A-Frame scene whenever settings change in the store
    this.settingsApplier.attachTo(this.baseScene);
  }
}


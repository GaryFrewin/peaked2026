import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, OnInit, signal } from '@angular/core';
import { BaseSceneComponent } from '../../../shared/components/base-scene/base-scene';
import { WallStore } from '../../../stores/wall.store';
import { HoldStore } from '../../../stores/hold.store';

@Component({
  selector: 'app-vr-climbing',
  standalone: true,
  imports: [BaseSceneComponent],
  templateUrl: './vr-climbing.html',
  styleUrl: './vr-climbing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VrClimbingComponent implements OnInit {
  protected readonly wallStore = inject(WallStore);
  protected readonly holdStore = inject(HoldStore);

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
          const version = walls[0].wall_versions[0];
          console.log('VR: Auto-selecting version:', version.id, 'model_path:', version.model_path);
          this.wallStore.selectVersion(version.id);
          this.holdStore.loadHolds(String(walls[0].id), String(version.id));
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
  }
}


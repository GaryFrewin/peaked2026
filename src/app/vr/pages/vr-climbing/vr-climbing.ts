import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
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

  ngOnInit(): void {
    // Load walls if not already loaded
    if (this.wallStore.walls().length === 0) {
      this.wallStore.loadWalls();
    }
  }

  onSceneReady(): void {
    console.log('VR scene ready');
    
    // Auto-select first wall and version if none selected
    const walls = this.wallStore.walls();
    if (walls.length > 0 && !this.wallStore.selectedWall()) {
      this.wallStore.selectWall(walls[0].id);
      if (walls[0].wall_versions.length > 0) {
        const version = walls[0].wall_versions[0];
        this.wallStore.selectVersion(version.id);
        this.holdStore.loadHolds(String(walls[0].id), String(version.id));
      }
    }
  }
}


import { computed, inject, Injectable, signal } from '@angular/core';
import { WallApi, Wall, WallVersion } from '../data-access/wall.api';

/**
 * WALL STORE
 *
 * Manages state for climbing wall data.
 * Uses Angular signals for reactive state management.
 *
 * RESPONSIBILITIES:
 * - Load walls from Flask API via WallApi
 * - Track selected wall and version
 * - Provide computed modelPath for GLTF loading
 * - Manage loading and error states
 */
@Injectable({ providedIn: 'root' })
export class WallStore {
  private api = inject(WallApi);

  // ========== SIGNALS (State) ==========

  readonly walls = signal<Wall[]>([]);
  readonly selectedWallId = signal<number | null>(null);
  readonly selectedVersionId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ========== COMPUTED ==========

  readonly selectedWall = computed(() => {
    const id = this.selectedWallId();
    return id ? this.walls().find(w => w.id === id) ?? null : null;
  });

  readonly selectedVersion = computed(() => {
    const wall = this.selectedWall();
    const versionId = this.selectedVersionId();
    if (!wall || !versionId) return null;
    return wall.wall_versions.find(v => v.id === versionId) ?? null;
  });

  readonly modelPath = computed(() => {
    const version = this.selectedVersion();
    return version?.model_path ?? null;
  });

  // ========== ACTIONS ==========

  loadWalls(): void {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.api.loadWalls().subscribe({
      next: (response) => {
        this.walls.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to load walls: ${err.statusText || err.message}`);
        this.isLoading.set(false);
      }
    });
  }

  selectWall(wallId: number): void {
    this.selectedWallId.set(wallId);
    this.selectedVersionId.set(null); // Reset version when wall changes
  }

  selectVersion(versionId: number): void {
    this.selectedVersionId.set(versionId);
  }

  clear(): void {
    this.walls.set([]);
    this.selectedWallId.set(null);
    this.selectedVersionId.set(null);
    this.isLoading.set(false);
    this.error.set(null);
  }
}

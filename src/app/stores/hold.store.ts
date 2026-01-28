import { inject, Injectable, signal } from '@angular/core';
import { HoldApi } from '../data-access/hold.api';
import { CreateHoldRequest, Hold, UpdateHoldRequest } from '../data-contracts/hold.model';
import { EditHoldStateStore } from './edit-hold-state.store';

/**
 * HOLD STORE
 *
 * Manages state for climbing hold data.
 * Uses Angular signals for reactive state management.
 *
 * RESPONSIBILITIES:
 * - Load holds from Flask API via HoldApi
 * - CRUD operations with optimistic updates
 * - Manage loading and error states
 * - Provide signal-based access to hold data
 * - Guard against duplicate requests
 */
@Injectable({ providedIn: 'root' })
export class HoldStore {
  private api = inject(HoldApi);
  private editHoldState = inject(EditHoldStateStore);

  /** Counter for generating temporary IDs (negative to avoid collision with server IDs) */
  private tempIdCounter = -1;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Array of climbing holds for current wall version */
  readonly holds = signal<Hold[]>([]);

  /** Is data currently being loaded? */
  readonly isLoading = signal<boolean>(false);

  /** Error message if operation failed */
  readonly error = signal<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Load holds for a specific wall version
   * Guards against duplicate requests while loading
   */
  loadHolds(wallId: string, versionId: string): void {
    if (this.isLoading()) {
      console.log('HoldStore: Already loading, skipping');
      return;
    }

    console.log('HoldStore: Loading holds for wall', wallId, 'version', versionId);
    this.isLoading.set(true);
    this.error.set(null);

    this.api.loadHolds(wallId, versionId).subscribe({
      next: (response) => {
        console.log('HoldStore: Received holds:', response.data.length, response.data);
        this.holds.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('HoldStore: Error loading holds:', err);
        this.error.set(`Failed to load holds: ${err.statusText || err.message}`);
        this.isLoading.set(false);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new hold with optimistic update
   * Immediately adds hold with temp ID, replaces with server ID on success
   */
  createHold(wallId: number, versionId: number, data: CreateHoldRequest): void {
    const tempId = this.tempIdCounter--;
    const now = new Date().toISOString();

    // Optimistic add with temp ID
    const tempHold: Hold = {
      id: tempId,
      wall_version_id: versionId,
      x: data.x,
      y: data.y,
      z: data.z,
      usage_count: 0,
      date_created: now,
      date_modified: now,
    };

    this.holds.update((current) => [...current, tempHold]);
    this.error.set(null);
    // Set the ghost hold position
    this.editHoldState.pendingHold.set({ x: data.x, y: data.y, z: data.z });

    this.api.createHold(wallId, versionId, data).subscribe({
      next: (response) => {
        // Replace temp hold with server response
        this.holds.update((current) =>
          current.map((h) => (h.id === tempId ? response.data : h))
        );
        this.editHoldState.pendingHold.set(null);
      },
      error: (err) => {
        // Rollback: remove temp hold
        this.holds.update((current) => current.filter((h) => h.id !== tempId));
        this.error.set(`Failed to create hold: ${err.statusText || err.message}`);
        this.editHoldState.pendingHold.set(null);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update a hold's position with optimistic update
   * Immediately updates position, rolls back on failure
   */
  updateHold(wallId: number, versionId: number, holdId: number, data: UpdateHoldRequest): void {
    // Capture original for rollback
    const originalHold = this.holds().find((h) => h.id === holdId);
    if (!originalHold) {
      this.error.set(`Hold with id ${holdId} not found`);
      return;
    }

    // Optimistic update
    this.holds.update((current) =>
      current.map((h) => (h.id === holdId ? { ...h, ...data } : h))
    );
    this.error.set(null);

    this.api.updateHold(wallId, versionId, holdId, data).subscribe({
      next: (response) => {
        // Apply server response (may include updated timestamp)
        this.holds.update((current) =>
          current.map((h) => (h.id === holdId ? response.data : h))
        );
      },
      error: (err) => {
        // Rollback to original
        this.holds.update((current) =>
          current.map((h) => (h.id === holdId ? originalHold : h))
        );
        this.error.set(`Failed to update hold: ${err.statusText || err.message}`);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Delete a hold with optimistic update
   * Immediately removes hold, restores on failure
   */
  deleteHold(wallId: number, versionId: number, holdId: number): void {
    // Capture for rollback
    const holdToDelete = this.holds().find((h) => h.id === holdId);
    if (!holdToDelete) {
      this.error.set(`Hold with id ${holdId} not found`);
      return;
    }

    // Optimistic delete
    this.holds.update((current) => current.filter((h) => h.id !== holdId));
    this.error.set(null);

    this.api.deleteHold(wallId, versionId, holdId).subscribe({
      next: () => {
        // Success - hold stays deleted
      },
      error: (err) => {
        // Rollback: restore hold
        this.holds.update((current) => [...current, holdToDelete]);
        this.error.set(`Failed to delete hold: ${err.statusText || err.message}`);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MERGE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Merge multiple holds into one
   * Optimistically removes old holds and adds new merged hold from API response
   */
  mergeHolds(
    wallId: number,
    versionId: number,
    holdIds: number[],
    strategy: 'average' | 'master'
  ): void {
    if (holdIds.length < 2) {
      this.error.set('Need at least 2 holds to merge');
      return;
    }

    // Capture holds for rollback
    const holdsToMerge = this.holds().filter((h) => holdIds.includes(h.id));

    // Optimistically remove the holds being merged
    this.holds.update((current) => current.filter((h) => !holdIds.includes(h.id)));
    this.error.set(null);

    this.api.mergeHolds(wallId, versionId, holdIds, strategy).subscribe({
      next: (response) => {
        // Clear selection (merged holds no longer exist)
        this.editHoldState.selectedHoldIds.set(new Set());
        // Add the new merged hold
        this.holds.update((current) => [...current, response.data]);
      },
      error: (err) => {
        // Rollback: restore the original holds
        this.holds.update((current) => [...current, ...holdsToMerge]);
        this.error.set(`Failed to merge holds: ${err.statusText || err.message}`);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEAR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clear all state
   */
  clear(): void {
    this.holds.set([]);
    this.isLoading.set(false);
    this.error.set(null);
  }
}

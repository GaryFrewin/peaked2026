import { inject, Injectable, signal } from '@angular/core';
import { HoldApi } from '../data-access/hold.api';
import { Hold } from '../data-contracts/hold.model';

/**
 * HOLD STORE
 *
 * Manages state for climbing hold data.
 * Uses Angular signals for reactive state management.
 *
 * RESPONSIBILITIES:
 * - Load holds from Flask API via HoldApi
 * - Manage loading and error states
 * - Provide signal-based access to hold data
 * - Guard against duplicate requests
 */
@Injectable({ providedIn: 'root' })
export class HoldStore {
  private api = inject(HoldApi);

  // ========== SIGNALS (State) ==========

  /**
   * Array of climbing holds for current wall version
   * Empty array = no data loaded yet
   */
  readonly holds = signal<Hold[]>([]);

  /**
   * Is data currently being loaded?
   */
  readonly isLoading = signal<boolean>(false);

  /**
   * Error message if loading failed
   * null = no error
   */
  readonly error = signal<string | null>(null);

  // ========== ACTIONS ==========

  /**
   * Load holds for a specific wall version
   * Guards against duplicate requests while loading
   *
   * @param wallId - Wall identifier
   * @param versionId - Wall version identifier
   */
  loadHolds(wallId: string, versionId: string): void {
    // Guard: Skip if already loading
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
      }
    });
  }

  /**
   * Clear all state
   * Useful when switching walls or cleaning up
   */
  clear(): void {
    this.holds.set([]);
    this.isLoading.set(false);
    this.error.set(null);
  }
}

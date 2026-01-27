import { computed, inject, Injectable, signal } from '@angular/core';
import { ClimbApi } from '../data-access/climb.api';
import { ClimbLog, CreateClimbRequest } from '../data-contracts/climb.model';

/**
 * CLIMB STORE
 *
 * Manages state for climb log data (distance logger feature).
 * Uses Angular signals for reactive state management.
 *
 * RESPONSIBILITIES:
 * - Load climbs from API
 * - Create and delete climbs
 * - Compute derived stats (today's distance, totals, averages)
 * - Manage loading and error states
 */
@Injectable({ providedIn: 'root' })
export class ClimbStore {
  private readonly api = inject(ClimbApi);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  readonly climbs = signal<ClimbLog[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** Today's date in YYYY-MM-DD format */
  readonly todaysDate = signal(new Date().toISOString().split('T')[0]);

  /** Daily climbing goal in meters */
  readonly dailyGoal = signal(300);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED - Today's Stats
  // ═══════════════════════════════════════════════════════════════════════════

  readonly todaysClimbs = computed(() => {
    const today = this.todaysDate();
    const all = this.climbs();
    const filtered = all.filter((c) => {
      // Parse the date string and extract YYYY-MM-DD in local timezone
      const d = new Date(c.date);
      const climbDate = d.getFullYear() + '-' + 
        String(d.getMonth() + 1).padStart(2, '0') + '-' + 
        String(d.getDate()).padStart(2, '0');
      return climbDate === today;
    });
    console.log('todaysClimbs filter:', { today, totalClimbs: all.length, matchingToday: filtered.length });
    return filtered;
  });

  readonly todaysDistance = computed(() => {
    const distance = this.todaysClimbs().reduce((sum, c) => sum + c.distance, 0);
    console.log('todaysDistance:', distance);
    return distance;
  });

  readonly progressPercent = computed(() =>
    Math.min(100, (this.todaysDistance() / this.dailyGoal()) * 100)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED - All-Time Stats
  // ═══════════════════════════════════════════════════════════════════════════

  readonly totalDistanceAllTime = computed(() =>
    this.climbs().reduce((sum, c) => sum + c.distance, 0)
  );

  readonly totalClimbsAllTime = computed(() => this.climbs().length);

  readonly averageDifficulty = computed(() => {
    const all = this.climbs();
    if (all.length === 0) return 0;
    const sum = all.reduce((acc, c) => acc + c.difficulty, 0);
    return Math.round((sum / all.length) * 10) / 10;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Load all climbs from API
   * Uses a 1-year lookback by default to get all history
   */
  loadClimbs(): void {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    // Default to 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startDate = oneYearAgo.toISOString().split('T')[0];

    this.api.loadClimbs(startDate).subscribe({
      next: (response) => {
        if (response.success) {
          // Sort by date descending (newest first)
          const sorted = [...response.data].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.climbs.set(sorted);
        } else {
          this.error.set(response.message);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to load climbs: ${err.message || err.statusText}`);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Add a new climb
   * Returns a promise that resolves when the climb is added (for animation timing)
   */
  addClimb(request: CreateClimbRequest): Promise<boolean> {
    return new Promise((resolve) => {
      this.api.createClimb(request).subscribe({
        next: (response) => {
          if (response.success) {
            // Add to front of list (newest first)
            this.climbs.update((list) => [response.data, ...list]);
            resolve(true);
          } else {
            this.error.set(response.message);
            resolve(false);
          }
        },
        error: (err) => {
          this.error.set(`Failed to add climb: ${err.message || err.statusText}`);
          resolve(false);
        },
      });
    });
  }

  /**
   * Delete a climb by ID
   * Returns a promise that resolves when deleted (for animation timing)
   */
  deleteClimb(id: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.api.deleteClimb(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.climbs.update((list) => list.filter((c) => c.id !== id));
            resolve(true);
          } else {
            this.error.set(response.message);
            resolve(false);
          }
        },
        error: (err) => {
          this.error.set(`Failed to delete climb: ${err.message || err.statusText}`);
          resolve(false);
        },
      });
    });
  }

  /**
   * Clear any error state
   */
  clearError(): void {
    this.error.set(null);
  }
}

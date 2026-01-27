import { computed, inject, Injectable, signal } from '@angular/core';
import { RouteApi } from '../data-access/route.api';
import { Route, Style } from '../data-contracts/route.model';

/**
 * ROUTE STORE
 *
 * Manages state for climbing route data.
 * Uses Angular signals for reactive state management.
 *
 * RESPONSIBILITIES:
 * - Load routes from API for a wall version
 * - Load available styles/tags
 * - Track selected route (single select for editing)
 * - Track selected routes (multi-select for display)
 * - Provide route colors for multi-route visualization
 * - CRUD operations with automatic refresh
 * - Manage loading and error states
 */
@Injectable({ providedIn: 'root' })
export class RouteStore {
  private readonly api = inject(RouteApi);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  readonly routes = signal<Route[]>([]);
  readonly styles = signal<Style[]>([]);
  readonly selectedRoute = signal<Route | null>(null);
  readonly selectedRoutes = signal<Route[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** Current wall ID for route operations */
  readonly currentWallId = signal<number | null>(null);

  /** Current version ID for route operations */
  readonly currentVersionId = signal<number | null>(null);

  // Color palette for multi-route display
  private readonly routeColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#95E1D3', // Mint
    '#F38181', // Coral
    '#AA96DA', // Purple
    '#FCBAD3', // Pink
    '#A8D8EA', // Light Blue
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  /** Check if a route is in the selected routes list */
  readonly isRouteSelectedFn = computed(() => {
    const selected = this.selectedRoutes();
    return (route: Route) => selected.some((r) => r.id === route.id);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS - Loading
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Load routes for a wall version
   */
  loadRoutes(wallId: number, versionId: number): void {
    if (this.isLoading()) {
      return;
    }

    this.currentWallId.set(wallId);
    this.currentVersionId.set(versionId);
    this.isLoading.set(true);
    this.error.set(null);

    this.api.loadRoutes(wallId, versionId).subscribe({
      next: (response) => {
        this.routes.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`Failed to load routes: ${err.statusText || err.message}`);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Load available route styles/tags
   */
  loadStyles(): void {
    this.api.loadStyles().subscribe({
      next: (response) => {
        this.styles.set(response.data);
      },
      error: () => {
        // Silently fail - styles are optional
        this.styles.set([]);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS - Selection
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Select a single route for editing/viewing
   * Also updates selectedRoutes for display
   */
  selectRoute(route: Route | null): void {
    this.selectedRoute.set(route);

    if (route === null) {
      this.selectedRoutes.set([]);
    } else {
      // Ensure selected route is in the display list
      const current = this.selectedRoutes();
      if (!current.some((r) => r.id === route.id)) {
        this.selectedRoutes.set([...current, route]);
      }
    }
  }

  /**
   * Toggle a route in/out of multi-selection
   */
  toggleRouteSelection(route: Route): void {
    const current = this.selectedRoutes();
    const index = current.findIndex((r) => r.id === route.id);

    if (index === -1) {
      this.selectedRoutes.set([...current, route]);
    } else {
      this.selectedRoutes.set(current.filter((r) => r.id !== route.id));
    }
  }

  /**
   * Check if a route is selected
   */
  isRouteSelected(route: Route): boolean {
    return this.selectedRoutes().some((r) => r.id === route.id);
  }

  /**
   * Get the display color for a route
   * Returns white if not selected, otherwise a color from the palette
   */
  getRouteColor(route: Route): string {
    const selected = this.selectedRoutes();
    const index = selected.findIndex((r) => r.id === route.id);

    if (index === -1) {
      return '#FFFFFF';
    }

    return this.routeColors[index % this.routeColors.length];
  }

  /**
   * Clear all route selections
   */
  clearSelectedRoutes(): void {
    this.selectedRoute.set(null);
    this.selectedRoutes.set([]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS - CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Save a new route
   */
  saveRoute(route: Route): void {
    const wallId = this.currentWallId();
    const versionId = this.currentVersionId();

    if (!wallId || !versionId) {
      this.error.set('No wall/version selected');
      return;
    }

    this.api.saveRoute(wallId, versionId, route).subscribe({
      next: (response) => {
        this.selectRoute(response.data);
        this.loadRoutes(wallId, versionId);
      },
      error: (err) => {
        this.error.set(`Failed to save route: ${err.statusText || err.message}`);
      },
    });
  }

  /**
   * Update an existing route
   */
  updateRoute(route: Route): void {
    const wallId = this.currentWallId();
    const versionId = this.currentVersionId();

    if (!wallId || !versionId) {
      this.error.set('No wall/version selected');
      return;
    }

    this.api.updateRoute(wallId, versionId, route).subscribe({
      next: (response) => {
        this.selectRoute(response.data);
        this.loadRoutes(wallId, versionId);
      },
      error: (err) => {
        this.error.set(`Failed to update route: ${err.statusText || err.message}`);
      },
    });
  }

  /**
   * Delete a route
   */
  deleteRoute(routeId: number): void {
    const wallId = this.currentWallId();
    const versionId = this.currentVersionId();

    if (!wallId || !versionId) {
      this.error.set('No wall/version selected');
      return;
    }

    // Check if we're deleting the selected route
    const wasSelected = this.selectedRoute()?.id === routeId;

    this.api.deleteRoute(wallId, versionId, routeId).subscribe({
      next: () => {
        if (wasSelected) {
          this.clearSelectedRoutes();
        }
        this.loadRoutes(wallId, versionId);
      },
      error: (err) => {
        this.error.set(`Failed to delete route: ${err.statusText || err.message}`);
      },
    });
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.routes.set([]);
    this.styles.set([]);
    this.selectedRoute.set(null);
    this.selectedRoutes.set([]);
    this.currentWallId.set(null);
    this.currentVersionId.set(null);
    this.isLoading.set(false);
    this.error.set(null);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteStore } from '../../../stores/route.store';
import { Route } from '../../../data-contracts/route.model';
import { filterRoutes } from '../../../shared/utils/route-filter.utils';

// PrimeNG - minimal for VR
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/**
 * VR ROUTE LIST COMPONENT
 *
 * Compact route selection interface optimized for Quest 2 browser.
 * Full-screen 2D overlay - user presses Meta button to access.
 *
 * Design goals:
 * - Maximize routes visible on screen (compact tiles)
 * - Large enough touch targets for controller pointing
 * - Clear visual feedback for selection
 * - Works at Quest 2's lower resolution
 */
@Component({
  selector: 'app-vr-route-list',
  standalone: true,
  imports: [FormsModule, InputTextModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './vr-route-list.html',
  styleUrl: './vr-route-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VrRouteListComponent {
  private readonly store = inject(RouteStore);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL STATE
  // ═══════════════════════════════════════════════════════════════════════════

  readonly searchFilter = signal('');

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED - from store
  // ═══════════════════════════════════════════════════════════════════════════

  readonly routes = this.store.routes;
  readonly selectedRoutes = this.store.selectedRoutes;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED - derived
  // ═══════════════════════════════════════════════════════════════════════════

  readonly filteredRoutes = computed(() => {
    return filterRoutes(this.routes(), this.searchFilter());
  });

  readonly selectionCount = computed(() => this.selectedRoutes().length);

  readonly showLoading = computed(() => this.isLoading());

  readonly showEmptyState = computed(
    () => !this.isLoading() && this.routes().length === 0
  );

  readonly showNoMatchState = computed(
    () =>
      !this.isLoading() &&
      this.routes().length > 0 &&
      this.filteredRoutes().length === 0
  );

  readonly showRouteGrid = computed(
    () => !this.isLoading() && this.filteredRoutes().length > 0
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  onRouteClick(route: Route): void {
    this.store.toggleRouteSelection(route);
  }

  onClearSelection(): void {
    this.store.clearSelectedRoutes();
  }

  isRouteSelected(route: Route): boolean {
    return this.store.isRouteSelected(route);
  }

  getRouteColor(route: Route): string {
    return this.store.getRouteColor(route);
  }

  onSearchChange(value: string): void {
    this.searchFilter.set(value);
  }

  /**
   * Format styles as a short string for compact display
   */
  getStylesText(route: Route): string {
    if (!route.styles || route.styles.length === 0) {
      return '';
    }
    return route.styles.map((s) => s.name).join(' · ');
  }
}

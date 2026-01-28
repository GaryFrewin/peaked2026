import { computed, Injectable, signal } from '@angular/core';

/**
 * Application modes for the climbing wall viewer/editor
 */
export enum AppMode {
  View = 'view',
  EditHolds = 'editHolds',
  CreateRoute = 'createRoute',
  EditRoute = 'editRoute'
}

/**
 * MODE STORE
 *
 * Tracks which mode the application is in.
 * Components and services can subscribe to mode changes
 * to adjust their behavior accordingly.
 *
 * SINGLE RESPONSIBILITY: Track current application mode.
 * Does NOT handle mode-specific logic - that belongs in
 * InteractionHandler or mode-specific services.
 */
@Injectable({ providedIn: 'root' })
export class ModeStore {
  /** Current application mode */
  readonly mode = signal<AppMode>(AppMode.View);

  /** True when in view mode (default, read-only) */
  readonly isViewMode = computed(() => this.mode() === AppMode.View);

  /** True when in edit holds mode */
  readonly isEditHoldsMode = computed(() => this.mode() === AppMode.EditHolds);

  /** True when in any route editing mode (create or edit) */
  readonly isRouteMode = computed(
    () => this.mode() === AppMode.CreateRoute || this.mode() === AppMode.EditRoute
  );

  /**
   * Change to a new mode
   */
  setMode(mode: AppMode): void {
    this.mode.set(mode);
  }

  /**
   * Return to view mode from any other mode
   */
  exitToView(): void {
    this.mode.set(AppMode.View);
  }
}

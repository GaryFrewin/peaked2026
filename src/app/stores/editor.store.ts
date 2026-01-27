import { computed, Injectable, signal } from '@angular/core';
import { Hold } from '../data-contracts/hold.model';
import { Route, RouteHold, Style } from '../data-contracts/route.model';

/**
 * Editor modes for the climbing wall editor
 */
export type EditorMode = 'view' | 'editHolds' | 'createRoute' | 'editRoute';

/**
 * A hold being added to a route in progress
 */
export interface RouteHoldInProgress {
  holdId: number;
  hold: Hold;
  forwardHandStart: boolean;
  forwardFootStart: boolean;
  reverseHandStart: boolean;
  reverseFootStart: boolean;
}

/**
 * Route being created or edited
 */
export interface RouteInProgress {
  baseRouteId?: number; // Set when editing existing route
  name: string;
  holds: RouteHoldInProgress[];
  forwardGrade?: number;
  reverseGrade?: number;
  forwardStarRating?: number;
  reverseStarRating?: number;
  styles: Style[];
  notes?: string;
}

/**
 * Partial update for route metadata
 */
export interface RouteMetadataUpdate {
  name?: string;
  forwardGrade?: number;
  reverseGrade?: number;
  forwardStarRating?: number;
  reverseStarRating?: number;
  styles?: Style[];
  notes?: string;
}

/**
 * EDITOR STORE
 *
 * Manages editor state for creating/editing holds and routes.
 * Separates editor concerns from data persistence (HoldStore, RouteStore).
 *
 * RESPONSIBILITIES:
 * - Track current editing mode
 * - Manage hold selection (single and multi-select)
 * - Track route being created/edited
 * - Provide computed properties for UI state
 */
@Injectable({ providedIn: 'root' })
export class EditorStore {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current editor mode */
  readonly mode = signal<EditorMode>('view');

  /** Set of selected hold IDs (for multi-select operations) */
  readonly selectedHoldIds = signal<Set<number>>(new Set());

  /** Currently hovered hold ID (for tooltips, highlighting) */
  readonly hoveredHoldId = signal<number | null>(null);

  /** Route being created or edited */
  readonly routeInProgress = signal<RouteInProgress | null>(null);

  /** Tracks if changes have been made since entering edit mode */
  private readonly _hasChanges = signal(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  /** Has unsaved changes been made? */
  readonly isDirty = computed(() => this._hasChanges());

  /** Number of selected holds */
  readonly selectedHoldCount = computed(() => this.selectedHoldIds().size);

  /** Can the current state be saved? */
  readonly canSave = computed(() => {
    const mode = this.mode();
    const rip = this.routeInProgress();

    if (mode === 'createRoute' || mode === 'editRoute') {
      // Need at least one hold to save a route
      return rip !== null && rip.holds.length > 0;
    }

    return false;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enter hold editing mode
   */
  enterEditHoldsMode(): void {
    this.clearSelection();
    this.mode.set('editHolds');
    this._hasChanges.set(false);
  }

  /**
   * Enter route creation mode with empty route
   */
  enterCreateRouteMode(): void {
    this.clearSelection();
    this.mode.set('createRoute');
    this.routeInProgress.set({
      name: '',
      holds: [],
      styles: [],
    });
    this._hasChanges.set(false);
  }

  /**
   * Enter route editing mode with existing route data
   */
  enterEditRouteMode(route: Route): void {
    this.clearSelection();
    this.mode.set('editRoute');
    this.routeInProgress.set(this.routeToRouteInProgress(route));
    this._hasChanges.set(false);
  }

  /**
   * Exit current edit mode and return to view
   */
  exitEditMode(): void {
    this.mode.set('view');
    this.routeInProgress.set(null);
    this._hasChanges.set(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HOLD SELECTION ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Select a hold
   * @param holdId - Hold to select
   * @param multiSelect - If true, add to selection; if false, replace selection
   */
  selectHold(holdId: number, multiSelect = false): void {
    this.selectedHoldIds.update((current) => {
      const next = new Set(multiSelect ? current : []);

      if (multiSelect && current.has(holdId)) {
        // Toggle off if already selected in multi-select mode
        next.delete(holdId);
      } else {
        next.add(holdId);
      }

      return next;
    });
  }

  /**
   * Clear all hold selections
   */
  clearSelection(): void {
    this.selectedHoldIds.set(new Set());
  }

  /**
   * Set the currently hovered hold
   */
  setHoveredHold(holdId: number | null): void {
    this.hoveredHoldId.set(holdId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE IN PROGRESS ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a hold to the route in progress
   */
  addHoldToRoute(hold: Hold): void {
    const rip = this.routeInProgress();
    if (!rip) return;

    // Don't add duplicates
    if (rip.holds.some((h) => h.holdId === hold.id)) {
      return;
    }

    this.routeInProgress.update((current) => {
      if (!current) return current;
      return {
        ...current,
        holds: [
          ...current.holds,
          {
            holdId: hold.id,
            hold,
            forwardHandStart: false,
            forwardFootStart: false,
            reverseHandStart: false,
            reverseFootStart: false,
          },
        ],
      };
    });

    this._hasChanges.set(true);
  }

  /**
   * Remove a hold from the route in progress
   */
  removeHoldFromRoute(holdId: number): void {
    this.routeInProgress.update((current) => {
      if (!current) return current;
      return {
        ...current,
        holds: current.holds.filter((h) => h.holdId !== holdId),
      };
    });

    this._hasChanges.set(true);
  }

  /**
   * Cycle forward start flag: none → handstart → footstart → none
   */
  cycleForwardStartFlag(holdId: number): void {
    this.routeInProgress.update((current) => {
      if (!current) return current;

      const holds = current.holds.map((h) => {
        if (h.holdId !== holdId) return h;

        // Cycle: none → hand → foot → none
        if (!h.forwardHandStart && !h.forwardFootStart) {
          return { ...h, forwardHandStart: true, forwardFootStart: false };
        } else if (h.forwardHandStart) {
          return { ...h, forwardHandStart: false, forwardFootStart: true };
        } else {
          return { ...h, forwardHandStart: false, forwardFootStart: false };
        }
      });

      return { ...current, holds };
    });

    this._hasChanges.set(true);
  }

  /**
   * Cycle reverse start flag: none → handstart → footstart → none
   */
  cycleReverseStartFlag(holdId: number): void {
    this.routeInProgress.update((current) => {
      if (!current) return current;

      const holds = current.holds.map((h) => {
        if (h.holdId !== holdId) return h;

        // Cycle: none → hand → foot → none
        if (!h.reverseHandStart && !h.reverseFootStart) {
          return { ...h, reverseHandStart: true, reverseFootStart: false };
        } else if (h.reverseHandStart) {
          return { ...h, reverseHandStart: false, reverseFootStart: true };
        } else {
          return { ...h, reverseHandStart: false, reverseFootStart: false };
        }
      });

      return { ...current, holds };
    });

    this._hasChanges.set(true);
  }

  /**
   * Update route metadata (name, grades, etc)
   */
  updateRouteMetadata(update: RouteMetadataUpdate): void {
    this.routeInProgress.update((current) => {
      if (!current) return current;
      return { ...current, ...update };
    });

    this._hasChanges.set(true);
  }

  /**
   * Check if a hold is in the current route
   */
  isHoldInRoute(holdId: number): boolean {
    const rip = this.routeInProgress();
    return rip?.holds.some((h) => h.holdId === holdId) ?? false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Convert a Route to RouteInProgress for editing
   */
  private routeToRouteInProgress(route: Route): RouteInProgress {
    return {
      baseRouteId: route.id,
      name: route.name ?? '',
      holds: route.route_holds.map((rh) => this.routeHoldToInProgress(rh)),
      forwardGrade: route.forward_grade,
      reverseGrade: route.reverse_grade,
      forwardStarRating: route.forward_star_rating,
      reverseStarRating: route.reverse_star_rating,
      styles: route.styles ?? [],
      notes: route.notes,
    };
  }

  /**
   * Convert a RouteHold to RouteHoldInProgress
   */
  private routeHoldToInProgress(rh: RouteHold): RouteHoldInProgress {
    return {
      holdId: rh.hold_id!,
      hold: rh.hold!,
      forwardHandStart: rh.forwardhandstart,
      forwardFootStart: rh.forwardfootstart,
      reverseHandStart: rh.reversehandstart,
      reverseFootStart: rh.reversefootstart,
    };
  }

  /**
   * Convert RouteInProgress back to Route for API submission
   */
  toRoute(wallVersionId: number): Route {
    const rip = this.routeInProgress();
    if (!rip) {
      throw new Error('No route in progress');
    }

    return {
      id: rip.baseRouteId,
      name: rip.name,
      wallversion_id: wallVersionId,
      route_holds: rip.holds.map((h) => ({
        hold_id: h.holdId,
        hold: h.hold,
        forwardhandstart: h.forwardHandStart,
        forwardfootstart: h.forwardFootStart,
        reversehandstart: h.reverseHandStart,
        reversefootstart: h.reverseFootStart,
      })),
      forward_grade: rip.forwardGrade,
      reverse_grade: rip.reverseGrade,
      forward_star_rating: rip.forwardStarRating,
      reverse_star_rating: rip.reverseStarRating,
      styles: rip.styles,
      notes: rip.notes,
    };
  }
}

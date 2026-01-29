import { Injectable, signal } from '@angular/core';
import { Route, RouteHold, createRoute, createRouteHold } from '../data-contracts/route.model';

/**
 * CreateRouteStateStore
 *
 * Holds all UI/interaction state for Create Route mode.
 * - draftRoute: The route being built (null if none)
 * - Cleared on mode exit
 */
@Injectable({ providedIn: 'root' })
export class CreateRouteStateStore {
  /** The route being built (null if none) */
  readonly draftRoute = signal<Route | null>(null);

  /**
   * Add a hold to the draft route
   * Creates route if none exists, prevents duplicates
   */
  addHold(holdId: number): void {
    const draft = this.draftRoute();

    if (draft === null) {
      // Create new route with this hold
      this.draftRoute.set(createRoute({
        route_holds: [createRouteHold({ hold_id: holdId })],
        forward_grade: 0,
      }));
      return;
    }

    // Check if hold already exists
    const exists = draft.route_holds.some(rh => rh.hold_id === holdId);
    if (exists) {
      return;
    }

    // Add hold to existing route
    this.draftRoute.set({
      ...draft,
      route_holds: [...draft.route_holds, createRouteHold({ hold_id: holdId })],
    });
  }

  /**
   * Remove a hold from the draft route
   */
  removeHold(holdId: number): void {
    const draft = this.draftRoute();
    if (draft === null) {
      return;
    }

    this.draftRoute.set({
      ...draft,
      route_holds: draft.route_holds.filter(rh => rh.hold_id !== holdId),
    });
  }

  /**
   * Cycle through flag states for a hold:
   * none → forwardhandstart → forwardfootstart → reversehandstart → reversefootstart → none
   * Adds hold if not present
   */
  cycleHoldFlags(holdId: number): void {
    console.log('[CreateRouteStateStore] cycleHoldFlags called for holdId:', holdId);
    const draft = this.draftRoute();

    // If no draft route, create one and add hold with first flag state
    if (draft === null) {
      console.log('[CreateRouteStateStore] No draft route, creating with forwardhandstart');
      this.draftRoute.set(createRoute({
        route_holds: [createRouteHold({
          hold_id: holdId,
          forwardhandstart: true,
        })],
        forward_grade: 0,
      }));
      return;
    }

    // Find the hold in route_holds
    const holdIndex = draft.route_holds.findIndex(rh => rh.hold_id === holdId);

    // If hold not in route, add it with first flag state
    if (holdIndex === -1) {
      console.log('[CreateRouteStateStore] Hold not in route, adding with forwardhandstart');
      this.draftRoute.set({
        ...draft,
        route_holds: [...draft.route_holds, createRouteHold({
          hold_id: holdId,
          forwardhandstart: true,
        })],
      });
      return;
    }

    // Cycle the flags
    const rh = draft.route_holds[holdIndex];
    const newRouteHolds = [...draft.route_holds];

    // Determine next state
    if (!rh.forwardhandstart && !rh.forwardfootstart && !rh.reversehandstart && !rh.reversefootstart) {
      // none → forwardhandstart
      console.log('[CreateRouteStateStore] none → forwardhandstart');
      newRouteHolds[holdIndex] = { ...rh, forwardhandstart: true };
    } else if (rh.forwardhandstart) {
      // forwardhandstart → forwardfootstart
      console.log('[CreateRouteStateStore] forwardhandstart → forwardfootstart');
      newRouteHolds[holdIndex] = { ...rh, forwardhandstart: false, forwardfootstart: true };
    } else if (rh.forwardfootstart) {
      // forwardfootstart → reversehandstart
      console.log('[CreateRouteStateStore] forwardfootstart → reversehandstart');
      newRouteHolds[holdIndex] = { ...rh, forwardfootstart: false, reversehandstart: true };
    } else if (rh.reversehandstart) {
      // reversehandstart → reversefootstart
      console.log('[CreateRouteStateStore] reversehandstart → reversefootstart');
      newRouteHolds[holdIndex] = { ...rh, reversehandstart: false, reversefootstart: true };
    } else if (rh.reversefootstart) {
      // reversefootstart → none
      console.log('[CreateRouteStateStore] reversefootstart → none');
      newRouteHolds[holdIndex] = { ...rh, reversefootstart: false };
    }

    this.draftRoute.set({
      ...draft,
      route_holds: newRouteHolds,
    });
  }

  /**
   * Clear all state (on mode exit)
   */
  clear(): void {
    this.draftRoute.set(null);
  }
}

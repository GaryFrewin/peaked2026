import { Hold } from './hold.model';

/**
 * Style/tag for categorizing routes (e.g., Overhang, Slab, Crimp)
 */
export interface Style {
  id?: number;
  name: string;
}

/**
 * A hold that is part of a route, with start/end position flags
 */
export interface RouteHold {
  id?: number;
  route_id?: number;
  hold_id?: number;
  hold?: Hold;
  forwardfootstart: boolean;
  forwardhandstart: boolean;
  reversefootstart: boolean;
  reversehandstart: boolean;
}

/**
 * A climbing route consisting of multiple holds
 */
export interface Route {
  id?: number;
  name?: string;
  wallversion_id?: number;
  created_by?: string;
  created_on?: string;
  route_holds: RouteHold[];
  forward_grade?: number;
  reverse_grade?: number;
  forward_star_rating?: number;
  reverse_star_rating?: number;
  styles?: Style[];
  notes?: string;
}

/**
 * API response wrapper for routes
 */
export interface RoutesResponse {
  data: Route[];
  message?: string;
  success?: boolean;
}

/**
 * API response wrapper for a single route
 */
export interface RouteResponse {
  data: Route;
  message?: string;
  success?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a Route with default values
 */
export function createRoute(partial: Partial<Route>): Route {
  return {
    route_holds: [],
    ...partial,
  };
}

/**
 * Create a RouteHold with default values (all flags false)
 */
export function createRouteHold(partial: Partial<RouteHold>): RouteHold {
  return {
    forwardfootstart: false,
    forwardhandstart: false,
    reversefootstart: false,
    reversehandstart: false,
    ...partial,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE HOLD BEHAVIOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cycle through start types for a hold:
 * none → forwardhandstart → forwardfootstart → none
 * 
 * If reverse flags are set, clears them and sets forwardhandstart
 */
export function cycleStartType(rh: RouteHold): void {
  // If any reverse flag is set, clear and go to forwardhandstart
  if (rh.reversehandstart || rh.reversefootstart) {
    rh.reversehandstart = false;
    rh.reversefootstart = false;
    rh.forwardhandstart = true;
    return;
  }

  // Cycle: forwardhandstart → forwardfootstart
  if (rh.forwardhandstart) {
    rh.forwardhandstart = false;
    rh.forwardfootstart = true;
    return;
  }

  // Cycle: forwardfootstart → none
  if (rh.forwardfootstart) {
    rh.forwardfootstart = false;
    return;
  }

  // Cycle: none → forwardhandstart
  rh.forwardhandstart = true;
}

/**
 * Cycle through end types for a hold:
 * none → reversehandstart → reversefootstart → none
 * 
 * If forward flags are set, clears them and sets reversehandstart
 */
export function cycleEndType(rh: RouteHold): void {
  // If any forward flag is set, clear and go to reversehandstart
  if (rh.forwardhandstart || rh.forwardfootstart) {
    rh.forwardhandstart = false;
    rh.forwardfootstart = false;
    rh.reversehandstart = true;
    return;
  }

  // Cycle: reversehandstart → reversefootstart
  if (rh.reversehandstart) {
    rh.reversehandstart = false;
    rh.reversefootstart = true;
    return;
  }

  // Cycle: reversefootstart → none
  if (rh.reversefootstart) {
    rh.reversefootstart = false;
    return;
  }

  // Cycle: none → reversehandstart
  rh.reversehandstart = true;
}

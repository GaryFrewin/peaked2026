import { inject, effect, runInInjectionContext } from '@angular/core';
import { RouteStore } from '../../stores/route.store';

/**
 * A-Frame component that renders route holds as colored spheres.
 * 
 * Automatically reacts to RouteStore.selectedRoutes changes and updates the scene.
 * Color logic: GREEN (start), CYAN (end), GOLD (link), WHITE (regular)
 */

enum HoldRole {
  NONE = 'NONE',
  START = 'START',
  END = 'END',
  LINK = 'LINK',
}

const COLORS = {
  START: '#00FF00', // Green
  END: '#20E7FF', // Cyan
  LINK: '#FFD700', // Gold
  REGULAR: '#FFFFFF', // White
};

interface RenderedRouteHold {
  holdId: number;
  x: number;
  y: number;
  z: number;
  color: string;
  routeId: number;
}

AFRAME.registerComponent('route-hold-renderer', {
  schema: {},

  init: function () {
    // Store reference to child entities for cleanup
    this.holdEntities = new Map<number, any>();

    // Get Angular services from the global app injector
    const injector = (window as any).__appInjector;
    
    if (!injector) {
      console.error('route-hold-renderer: Could not access Angular injector');
      return;
    }

    const routeStore = injector.get(RouteStore);

    // Create effect that runs whenever selectedRoutes changes
    // Must run in injection context
    runInInjectionContext(injector, () => {
      effect(() => {
        const routes = routeStore.selectedRoutes();
        this.renderRouteHolds(routes);
      });
    });
  },

  renderRouteHolds: function (routes: any[]) {
    if (routes.length === 0) {
      this.clearAllHolds();
      return;
    }

    const holdRoleMap = this.buildHoldRoleMap(routes);
    const seenHoldIds = new Set<number>();
    const currentHolds: RenderedRouteHold[] = [];

    routes.forEach((route) => {
      (route.route_holds ?? []).forEach((routeHold: any) => {
        if (!routeHold.hold) return;

        const hold = routeHold.hold;
        if (seenHoldIds.has(hold.id)) return;

        seenHoldIds.add(hold.id);
        currentHolds.push({
          holdId: hold.id,
          x: hold.x,
          y: hold.y,
          z: hold.z,
          color: this.determineHoldColor(hold.id, holdRoleMap),
          routeId: route.id ?? 0,
        });
      });
    });

    // Update scene: remove holds no longer needed, add/update current holds
    this.updateHoldEntities(currentHolds);
  },

  buildHoldRoleMap: function (routes: any[]): Map<number, HoldRole> {
    const holdRoles = new Map<number, HoldRole>();

    for (const route of routes) {
      for (const routeHold of route.route_holds || []) {
        if (!routeHold.hold) continue;

        const holdId = routeHold.hold.id;
        const isStart = routeHold.forwardhandstart || routeHold.forwardfootstart;
        const isEnd = routeHold.reversehandstart || routeHold.reversefootstart;

        if (isStart || isEnd) {
          const currentRole = holdRoles.get(holdId) || HoldRole.NONE;

          if (isStart && currentRole === HoldRole.END) {
            holdRoles.set(holdId, HoldRole.LINK);
          } else if (isEnd && currentRole === HoldRole.START) {
            holdRoles.set(holdId, HoldRole.LINK);
          } else if (isStart && currentRole === HoldRole.NONE) {
            holdRoles.set(holdId, HoldRole.START);
          } else if (isEnd && currentRole === HoldRole.NONE) {
            holdRoles.set(holdId, HoldRole.END);
          }
        }
      }
    }

    return holdRoles;
  },

  determineHoldColor: function (holdId: number, holdRoleMap: Map<number, HoldRole>): string {
    const role = holdRoleMap.get(holdId);

    switch (role) {
      case HoldRole.LINK:
        return COLORS.LINK;
      case HoldRole.START:
        return COLORS.START;
      case HoldRole.END:
        return COLORS.END;
      default:
        return COLORS.REGULAR;
    }
  },

  updateHoldEntities: function (holds: RenderedRouteHold[]) {
    const currentHoldIds = new Set(holds.map((h) => h.holdId));

    // Remove holds that are no longer in the route
    this.holdEntities.forEach((entity: any, holdId: number) => {
      if (!currentHoldIds.has(holdId)) {
        this.el.removeChild(entity);
        this.holdEntities.delete(holdId);
      }
    });

    // Add or update holds
    holds.forEach((hold) => {
      let entity = this.holdEntities.get(hold.holdId);

      if (!entity) {
        // Create new sphere
        entity = document.createElement('a-sphere');
        entity.setAttribute('class', 'route-hold');
        entity.setAttribute('radius', '0.06');
        this.el.appendChild(entity);
        this.holdEntities.set(hold.holdId, entity);
      }

      // Update position and color
      entity.setAttribute('position', `${hold.x} ${hold.y} ${hold.z}`);
      entity.setAttribute(
        'material',
        `color: ${hold.color}; emissive: ${hold.color}; emissiveIntensity: 0.8; opacity: 0.85; transparent: true`
      );
    });
  },

  clearAllHolds: function () {
    this.holdEntities.forEach((entity: any) => {
      this.el.removeChild(entity);
    });
    this.holdEntities.clear();
  },

  remove: function () {
    this.clearAllHolds();
  },
});

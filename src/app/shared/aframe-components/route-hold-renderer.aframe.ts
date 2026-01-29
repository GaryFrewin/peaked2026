import { inject, effect, runInInjectionContext } from '@angular/core';
import { RouteStore } from '../../stores/route.store';
import { CreateRouteStateStore } from '../../stores/create-route-state.store';
import { ModeStore, AppMode } from '../../stores/mode.store';
import { HoldStore } from '../../stores/hold.store';

// THREE.js is provided globally by A-Frame
declare const THREE: any;

/**
 * A-Frame component that renders route holds as colored spheres.
 * 
 * Automatically reacts to RouteStore.selectedRoutes or CreateRouteStateStore.draftRoute
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

const ICON_PATHS = {
  HAND: 'assets/images/icon-hand.svg',
  FOOT: 'assets/images/icon-foot.svg',
};

interface RenderedRouteHold {
  holdId: number;
  x: number;
  y: number;
  z: number;
  color: string;
  routeId: number;
  iconType?: 'hand' | 'foot' | null; // Icon to display above hold
}

AFRAME.registerComponent('route-hold-renderer', {
  schema: {},

  init: function () {
    // Store reference to child entities for cleanup
    this.holdEntities = new Map<number, any>();
    this.iconEntities = new Map<number, any>();
    this.camera = null;

    // Get Angular services from the global app injector
    const injector = (window as any).__appInjector;
    
    if (!injector) {
      console.error('route-hold-renderer: Could not access Angular injector');
      return;
    }

    const routeStore = injector.get(RouteStore);
    const modeStore = injector.get(ModeStore);
    const createRouteState = injector.get(CreateRouteStateStore);
    const holdStore = injector.get(HoldStore);

    // Create effect that runs whenever mode, selectedRoutes, or draftRoute changes
    // Must run in injection context
    runInInjectionContext(injector, () => {
      effect(() => {
        const mode = modeStore.mode();
        const allHolds = holdStore.holds(); // Track holds signal
        
        // In CreateRoute mode, render draft route
        if (mode === AppMode.CreateRoute) {
          const draft = createRouteState.draftRoute();
          if (draft) {
            this.renderDraftRoute(draft, allHolds);
          } else {
            this.clearAllHolds();
          }
          return;
        }

        // Otherwise render selected routes
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

  renderDraftRoute: function (draft: any, allHolds: any[]) {
    const currentHolds: RenderedRouteHold[] = [];

    (draft.route_holds ?? []).forEach((routeHold: any) => {
      const holdId = routeHold.hold_id;
      if (!holdId) return;

      // Find hold from HoldStore
      const hold = allHolds.find((h: any) => h.id === holdId);
      if (!hold) return;

      // Determine color based on flags
      const isHandStart = routeHold.forwardhandstart || routeHold.reversehandstart;
      const isFootStart = routeHold.forwardfootstart || routeHold.reversefootstart;
      const isStart = routeHold.forwardhandstart || routeHold.forwardfootstart;
      const isEnd = routeHold.reversehandstart || routeHold.reversefootstart;

      let color = COLORS.REGULAR;
      if (isStart && isEnd) {
        color = COLORS.LINK;
      } else if (isStart) {
        color = COLORS.START;
      } else if (isEnd) {
        color = COLORS.END;
      }

      // Determine icon type (hand vs foot)
      let iconType: 'hand' | 'foot' | null = null;
      if (isHandStart) {
        iconType = 'hand';
      } else if (isFootStart) {
        iconType = 'foot';
      }

      currentHolds.push({
        holdId: hold.id,
        x: hold.x,
        y: hold.y,
        z: hold.z,
        color: color,
        routeId: 0, // Draft route has no ID yet
        iconType: iconType,
      });
    });

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

    // Remove icons for holds no longer in route
    this.iconEntities.forEach((entity: any, holdId: number) => {
      if (!currentHoldIds.has(holdId)) {
        this.el.removeChild(entity);
        this.iconEntities.delete(holdId);
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
        `color: ${hold.color}; shader: flat; emissive: ${hold.color}; emissiveIntensity: 1.2; opacity: 0.95; transparent: true`
      );

      // Handle icon - only show for start/end holds with hand/foot flag
      this.updateHoldIcon(hold);
    });
  },

  updateHoldIcon: function (hold: RenderedRouteHold) {
    let iconEntity = this.iconEntities.get(hold.holdId);

    if (!hold.iconType) {
      // No icon needed - remove if exists
      if (iconEntity) {
        this.el.removeChild(iconEntity);
        this.iconEntities.delete(hold.holdId);
      }
      return;
    }

    const iconSrc = hold.iconType === 'hand' ? ICON_PATHS.HAND : ICON_PATHS.FOOT;

    if (!iconEntity) {
      // Create new icon entity - will be rotated to face camera in tick()
      iconEntity = document.createElement('a-image');
      iconEntity.setAttribute('class', 'hold-icon');
      iconEntity.setAttribute('width', '0.15');
      iconEntity.setAttribute('height', '0.15');
      iconEntity.setAttribute('material', 'alphaTest: 0.1; transparent: true; depthTest: false');
      
      this.el.appendChild(iconEntity);
      this.iconEntities.set(hold.holdId, iconEntity);
    }

    // Update icon position (above the hold sphere)
    const iconY = hold.y + 0.14;
    iconEntity.setAttribute('position', `${hold.x} ${iconY} ${hold.z}`);
    iconEntity.setAttribute('src', iconSrc);
  },

  tick: function () {
    // Make all icons face the camera
    if (this.iconEntities.size === 0) return;

    // Get camera reference (cache it)
    if (!this.camera) {
      this.camera = this.el.sceneEl?.camera;
      if (!this.camera) return;
    }

    // Get camera world position
    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);

    // Rotate each icon to face camera
    this.iconEntities.forEach((iconEntity: any) => {
      if (!iconEntity.object3D) return;
      
      const iconPosition = iconEntity.object3D.position;
      
      // Calculate rotation to face camera (only Y-axis rotation for billboard effect)
      const dx = cameraPosition.x - iconPosition.x;
      const dz = cameraPosition.z - iconPosition.z;
      const angle = Math.atan2(dx, dz);
      
      iconEntity.object3D.rotation.y = angle;
    });
  },

  clearAllHolds: function () {
    this.holdEntities.forEach((entity: any) => {
      this.el.removeChild(entity);
    });
    this.holdEntities.clear();

    this.iconEntities.forEach((entity: any) => {
      this.el.removeChild(entity);
    });
    this.iconEntities.clear();
  },

  remove: function () {
    this.clearAllHolds();
  },
});

import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, computed } from '@angular/core';
import { RouteStore } from '../../../stores/route.store';

export interface RenderedRouteHold {
  holdId: number;
  position: { x: number; y: number; z: number };
  color: string;
  routeId: number;
  routeName: string;
}

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

@Component({
  selector: 'app-route-hold-renderer',
  templateUrl: './route-hold-renderer.html',
  styleUrl: './route-hold-renderer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
})
export class RouteHoldRendererComponent {
  private readonly routeStore = inject(RouteStore);

  readonly routeHoldsToRender = computed<RenderedRouteHold[]>(() => {
    const routes = this.routeStore.selectedRoutes();
    if (routes.length === 0) {
      return [];
    }

    const holdRoleMap = this.buildHoldRoleMap(routes);
    const seenHoldIds = new Set<number>();
    const result: RenderedRouteHold[] = [];

    routes.forEach((route) => {
      (route.route_holds ?? []).forEach((routeHold) => {
        if (!routeHold.hold) {
          return;
        }

        const hold = routeHold.hold;
        if (seenHoldIds.has(hold.id)) {
          return;
        }

        seenHoldIds.add(hold.id);
        result.push({
          holdId: hold.id,
          position: {
            x: hold.x,
            y: hold.y,
            z: hold.z,
          },
          color: this.determineHoldColor(hold.id, holdRoleMap),
          routeId: route.id ?? 0,
          routeName: route.name ?? 'Unnamed',
        });
      });
    });

    return result;
  });

  private buildHoldRoleMap(routes: any[]): Map<number, HoldRole> {
    const holdRoles = new Map<number, HoldRole>();

    for (const route of routes) {
      for (const routeHold of route.route_holds || []) {
        if (!routeHold.hold) continue;

        const holdId = routeHold.hold.id;
        const isStart =
          routeHold.forwardhandstart || routeHold.forwardfootstart;
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
  }

  private determineHoldColor(
    holdId: number,
    holdRoleMap: Map<number, HoldRole>
  ): string {
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
  }
}

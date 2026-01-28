import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
  input,
  output,
  inject,
  computed,
} from '@angular/core';

// Import A-Frame behaviours (self-registering)
import '../../../vr/behaviours/wave-animator';
import '../../../vr/behaviours/desktop-interaction-manager';
import { registerDesktopInteractionManager } from '../../../vr/behaviours/desktop-interaction-manager';
registerDesktopInteractionManager();

// Import InteractionBus to ensure it's instantiated and registered on window
import { InteractionBus } from '../../services/interaction/interaction-bus';

import { Hold } from '../../../data-contracts/hold.model';
import { RouteStore } from '../../../stores/route.store';
import { Route, RouteHold } from '../../../data-contracts/route.model';

/**
 * Represents a route hold ready for 3D rendering
 */
export interface RenderedRouteHold {
  holdId: number;
  position: { x: number; y: number; z: number };
  color: string;
  routeId: number;
  routeName: string;
}

/**
 * Tracks a hold's role across multiple routes
 */
interface HoldRoleMap {
  holdId: number;
  hold: Hold;
  isStartIn: Route[]; // Routes where this hold is a start
  isEndIn: Route[]; // Routes where this hold is an end
  regularIn: Route[]; // Routes where this hold is just a regular hold
}

// Route hold color constants (for route visualization only)
const COLORS = {
  START: '#00FF00', // Green for start holds
  END: '#20E7FF', // Cyan for end holds
  LINK: '#FFD700', // Gold for link holds (start of one route + end of another)
  REGULAR: '#FFFFFF', // White for regular holds
};

@Component({
  selector: 'app-base-scene',
  imports: [],
  standalone: true,
  templateUrl: './base-scene.html',
  styleUrl: './base-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BaseSceneComponent implements AfterViewInit {
  @ViewChild('scene', { static: false }) sceneElement!: ElementRef<HTMLElement>;
  @ViewChild('holdsContainer', { static: false }) holdsContainerRef!: ElementRef<HTMLElement>;

  private readonly routeStore = inject(RouteStore);
  
  // Inject InteractionBus to ensure it's instantiated and registered on window.peakedBus
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly interactionBus = inject(InteractionBus);

  // Inputs
  readonly wallModelUrl = input<string>('');
  readonly holds = input<Hold[]>([]);
  readonly visible = input(true);
  
  /**
   * Callback to get material string for a hold.
   * Parent component provides this to control hold styling.
   * Default: simple white material.
   */
  readonly holdMaterialFn = input<(holdId: number) => string>(() => 'color: #FFFFFF; opacity: 0.8');

  // Outputs
  readonly sceneReady = output<void>();

  // Route visualization from store
  readonly selectedRoutes = this.routeStore.selectedRoutes;

  /**
   * Compute route holds to render in the 3D scene.
   *
   * Color logic:
   * - Single route: green=start, cyan=end, white=regular
   * - Multiple routes: same, BUT if a hold is START in one route
   *   AND END in another, it becomes GOLD (link point)
   */
  readonly routeHoldsToRender = computed<RenderedRouteHold[]>(() => {
    const routes = this.selectedRoutes();
    if (routes.length === 0) {
      return [];
    }

    // Build a map of holdId -> roles across all routes
    const holdRoles = this.buildHoldRoleMap(routes);

    // Convert to rendered holds with correct colors
    const result: RenderedRouteHold[] = [];
    const renderedHoldIds = new Set<number>();

    holdRoles.forEach((roleMap) => {
      // Skip duplicates (same hold in multiple routes)
      if (renderedHoldIds.has(roleMap.holdId)) {
        return;
      }
      renderedHoldIds.add(roleMap.holdId);

      const color = this.determineHoldColor(roleMap, routes.length);

      result.push({
        holdId: roleMap.holdId,
        position: {
          x: roleMap.hold.x,
          y: roleMap.hold.y,
          z: roleMap.hold.z,
        },
        color,
        routeId: roleMap.isStartIn[0]?.id ?? roleMap.isEndIn[0]?.id ?? roleMap.regularIn[0]?.id ?? 0,
        routeName: roleMap.isStartIn[0]?.name ?? roleMap.isEndIn[0]?.name ?? roleMap.regularIn[0]?.name ?? 'Unnamed',
      });
    });

    return result;
  });

  /**
   * Build a map tracking each hold's role (start/end/regular) across all routes
   */
  private buildHoldRoleMap(routes: Route[]): HoldRoleMap[] {
    const holdMap = new Map<number, HoldRoleMap>();

    routes.forEach((route: Route) => {
      (route.route_holds ?? []).forEach((routeHold: RouteHold) => {
        if (!routeHold.hold) {
          return;
        }

        const holdId = routeHold.hold.id;
        let entry = holdMap.get(holdId);

        if (!entry) {
          entry = {
            holdId,
            hold: routeHold.hold,
            isStartIn: [],
            isEndIn: [],
            regularIn: [],
          };
          holdMap.set(holdId, entry);
        }

        // Categorize the hold's role in this route
        if (routeHold.forwardhandstart || routeHold.forwardfootstart) {
          entry.isStartIn.push(route);
        } else if (routeHold.reversehandstart || routeHold.reversefootstart) {
          entry.isEndIn.push(route);
        } else {
          entry.regularIn.push(route);
        }
      });
    });

    return Array.from(holdMap.values());
  }

  /**
   * Determine the display color for a hold based on its roles
   *
   * Priority:
   * 1. LINK (gold) - start in one route AND end in another
   * 2. START (green) - start in any route
   * 3. END (cyan) - end in any route
   * 4. REGULAR (white) - just a normal hold
   */
  private determineHoldColor(roleMap: HoldRoleMap, routeCount: number): string {
    const isStart = roleMap.isStartIn.length > 0;
    const isEnd = roleMap.isEndIn.length > 0;

    // Link: start in one route, end in different route
    if (isStart && isEnd) {
      // Check they're different routes (not same route marked as both start+end)
      const startRouteIds = new Set(roleMap.isStartIn.map((r) => r.id));
      const hasLinkAcrossRoutes = roleMap.isEndIn.some((r) => !startRouteIds.has(r.id));
      if (hasLinkAcrossRoutes) {
        return COLORS.LINK;
      }
    }

    // Start holds take precedence
    if (isStart) {
      return COLORS.START;
    }

    // End holds
    if (isEnd) {
      return COLORS.END;
    }

    // Regular holds are always white (regardless of single/multi route)
    return COLORS.REGULAR;
  }

  ngAfterViewInit(): void {
    const scene = this.sceneElement.nativeElement;

    scene.addEventListener(
      'loaded',
      () => {
        this.sceneReady.emit();
      },
      { once: true }
    );
  }
}

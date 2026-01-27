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

// Route hold color constants
const COLORS = {
  START: '#00FF00', // Green for start holds
  END: '#20E7FF', // Cyan for end holds
  SINGLE_ROUTE: '#FFFFFF', // White when single route
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

  private readonly routeStore = inject(RouteStore);

  // Inputs
  readonly wallModelUrl = input<string>('');
  readonly holds = input<Hold[]>([]);
  readonly visible = input(true);

  // Outputs
  readonly sceneReady = output<void>();

  // Route visualization from store
  readonly selectedRoutes = this.routeStore.selectedRoutes;

  /**
   * Compute route holds to render in the 3D scene.
   * Handles color assignment based on hold type (start/end) and
   * whether single or multiple routes are selected.
   */
  readonly routeHoldsToRender = computed<RenderedRouteHold[]>(() => {
    const routes = this.selectedRoutes();
    if (routes.length === 0) {
      return [];
    }

    const useRouteColors = routes.length > 1;
    const result: RenderedRouteHold[] = [];

    routes.forEach((route: Route) => {
      const routeColor = useRouteColors
        ? this.routeStore.getRouteColor(route)
        : COLORS.SINGLE_ROUTE;

      (route.route_holds ?? []).forEach((routeHold: RouteHold) => {
        // Skip if hold data is missing
        if (!routeHold.hold) {
          return;
        }

        // Determine color based on hold type
        let color = routeColor;
        if (routeHold.forwardhandstart || routeHold.forwardfootstart) {
          color = COLORS.START;
        } else if (routeHold.reversehandstart || routeHold.reversefootstart) {
          color = COLORS.END;
        }

        result.push({
          holdId: routeHold.hold.id,
          position: {
            x: routeHold.hold.x,
            y: routeHold.hold.y,
            z: routeHold.hold.z,
          },
          color,
          routeId: route.id ?? 0,
          routeName: route.name ?? 'Unnamed',
        });
      });
    });

    return result;
  });

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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouteHoldRendererComponent } from './route-hold-renderer';
import { RouteStore } from '../../../stores/route.store';

describe('RouteHoldRendererComponent', () => {
  let component: RouteHoldRendererComponent;
  let fixture: ComponentFixture<RouteHoldRendererComponent>;
  let mockRouteStore: { selectedRoutes: ReturnType<typeof signal> };

  beforeEach(() => {
    // Mock RouteStore with a signal
    mockRouteStore = {
      selectedRoutes: signal([]),
    };

    TestBed.configureTestingModule({
      imports: [RouteHoldRendererComponent],
      providers: [{ provide: RouteStore, useValue: mockRouteStore }],
    });

    fixture = TestBed.createComponent(RouteHoldRendererComponent);
    component = fixture.componentInstance;
  });

  describe('routeHoldsToRender', () => {
    it('test_should_return_empty_array_when_no_routes_selected', () => {
      /**
       * Core behavior: Component should handle the zero-state gracefully
       * and not attempt to process holds when no routes are active.
       */
      mockRouteStore.selectedRoutes.set([]);

      const result = component.routeHoldsToRender();

      expect(result).toEqual([]);
    });

    it('test_should_render_holds_from_single_route', () => {
      /**
       * Basic functionality: Extract holds from a route and prepare them for 3D rendering.
       * Each rendered hold should have position, color, and tracking identifiers.
       */
      const hold1 = { id: 1, x: 0, y: 1, z: 0 };
      const hold2 = { id: 2, x: 1, y: 1.5, z: 0 };
      
      const route = {
        id: 100,
        name: 'Test Route',
        route_holds: [
          { hold: hold1, forwardhandstart: true },
          { hold: hold2, forwardhandstart: false },
        ],
      };

      mockRouteStore.selectedRoutes.set([route]);

      const result = component.routeHoldsToRender();

      expect(result.length).toBe(2);
      expect(result[0].holdId).toBe(1);
      expect(result[0].position).toEqual({ x: 0, y: 1, z: 0 });
      expect(result[1].holdId).toBe(2);
      expect(result[1].position).toEqual({ x: 1, y: 1.5, z: 0 });
    });

    it('test_should_color_start_holds_green', () => {
      /**
       * Route visualization: Start holds (forward hand/foot start) are rendered green
       * to indicate the beginning of a route.
       */
      const startHold = { id: 1, x: 0, y: 1, z: 0 };
      
      const route = {
        id: 100,
        name: 'Test Route',
        route_holds: [
          { hold: startHold, forwardhandstart: true },
        ],
      };

      mockRouteStore.selectedRoutes.set([route]);

      const result = component.routeHoldsToRender();

      expect(result[0].color).toBe('#00FF00'); // Green for start
    });

    it('test_should_color_end_holds_cyan', () => {
      /**
       * End holds (reverse hand/foot start) are cyan to mark route completion.
       */
      const endHold = { id: 2, x: 1, y: 2, z: 0 };
      
      const route = {
        id: 100,
        name: 'Test Route',
        route_holds: [
          { hold: endHold, reversehandstart: true },
        ],
      };

      mockRouteStore.selectedRoutes.set([route]);

      const result = component.routeHoldsToRender();

      expect(result[0].color).toBe('#20E7FF'); // Cyan for end
    });

    it('test_should_color_regular_holds_white', () => {
      /**
       * Regular holds (no start/end flags) are white.
       */
      const regularHold = { id: 3, x: 0.5, y: 1.5, z: 0 };
      
      const route = {
        id: 100,
        name: 'Test Route',
        route_holds: [
          { hold: regularHold },
        ],
      };

      mockRouteStore.selectedRoutes.set([route]);

      const result = component.routeHoldsToRender();

      expect(result[0].color).toBe('#FFFFFF'); // White for regular
    });

    it('test_should_color_link_holds_gold_when_start_in_one_route_and_end_in_another', () => {
      /**
       * Link holds: A hold that is a START in one route and END in a different route
       * becomes GOLD to show it connects two routes.
       */
      const linkHold = { id: 5, x: 1, y: 1, z: 0 };
      
      const route1 = {
        id: 100,
        name: 'Route 1',
        route_holds: [
          { hold: linkHold, reversehandstart: true }, // End of route 1
        ],
      };

      const route2 = {
        id: 101,
        name: 'Route 2',
        route_holds: [
          { hold: linkHold, forwardhandstart: true }, // Start of route 2
        ],
      };

      mockRouteStore.selectedRoutes.set([route1, route2]);

      const result = component.routeHoldsToRender();

      expect(result.length).toBe(1); // Same hold, rendered once
      expect(result[0].holdId).toBe(5);
      expect(result[0].color).toBe('#FFD700'); // Gold for link
    });

    it('test_should_deduplicate_holds_across_multiple_routes', () => {
      /**
       * When the same hold appears in multiple routes, render it only once.
       */
      const sharedHold = { id: 10, x: 1, y: 1, z: 0 };
      
      const route1 = {
        id: 100,
        name: 'Route 1',
        route_holds: [
          { hold: sharedHold },
        ],
      };

      const route2 = {
        id: 101,
        name: 'Route 2',
        route_holds: [
          { hold: sharedHold },
        ],
      };

      mockRouteStore.selectedRoutes.set([route1, route2]);

      const result = component.routeHoldsToRender();

      expect(result.length).toBe(1);
      expect(result[0].holdId).toBe(10);
    });

    it('test_should_prioritize_start_color_over_end_when_hold_is_both_in_same_route', () => {
      /**
       * Edge case: If a hold is marked as both start AND end in the same route,
       * start color (green) takes precedence.
       */
      const bothHold = { id: 15, x: 1, y: 1, z: 0 };
      
      const route = {
        id: 100,
        name: 'Test Route',
        route_holds: [
          { hold: bothHold, forwardhandstart: true, reversehandstart: true },
        ],
      };

      mockRouteStore.selectedRoutes.set([route]);

      const result = component.routeHoldsToRender();

      expect(result[0].color).toBe('#00FF00'); // Start takes precedence
    });

    it('test_should_handle_foot_start_markers_same_as_hand_start', () => {
      /**
       * Foot start markers (forwardfootstart, reversefootstart) work the same
       * as hand start markers for color determination.
       */
      const footStartHold = { id: 20, x: 0, y: 0.5, z: 0 };
      const footEndHold = { id: 21, x: 0, y: 2, z: 0 };
      
      const route = {
        id: 100,
        name: 'Test Route',
        route_holds: [
          { hold: footStartHold, forwardfootstart: true },
          { hold: footEndHold, reversefootstart: true },
        ],
      };

      mockRouteStore.selectedRoutes.set([route]);

      const result = component.routeHoldsToRender();

      expect(result[0].color).toBe('#00FF00'); // Green for foot start
      expect(result[1].color).toBe('#20E7FF'); // Cyan for foot end
    });

    it('test_should_skip_route_holds_with_null_hold_reference', () => {
      /**
       * Data integrity: Skip route_holds entries where the hold reference is null/undefined.
       */
      const validHold = { id: 1, x: 0, y: 1, z: 0 };
      
      const route = {
        id: 100,
        name: 'Test Route',
        route_holds: [
          { hold: null, forwardhandstart: true },
          { hold: validHold },
          { hold: undefined },
        ],
      };

      mockRouteStore.selectedRoutes.set([route]);

      const result = component.routeHoldsToRender();

      expect(result.length).toBe(1);
      expect(result[0].holdId).toBe(1);
    });
  });
});

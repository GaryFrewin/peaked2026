import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BaseSceneComponent, RenderedRouteHold } from './base-scene';
import { RouteStore } from '../../../stores/route.store';
import { Route, RouteHold } from '../../../data-contracts/route.model';
import { Hold } from '../../../data-contracts/hold.model';

/**
 * BASE SCENE COMPONENT TESTS
 *
 * Tests for 3D visualization including route holds in the A-Frame scene.
 * The base scene renders route holds as colored spheres based on
 * the selected routes in RouteStore.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function createMockHold(id: number, x: number, y: number, z: number): Hold {
  return {
    id,
    x,
    y,
    z,
    wall_version_id: 1,
    usage_count: 0,
    date_created: '2026-01-01',
    date_modified: '2026-01-01',
  };
}

function createMockRouteHold(
  holdId: number,
  hold: Hold,
  options: Partial<RouteHold> = {}
): RouteHold {
  return {
    id: holdId,
    hold_id: holdId,
    hold,
    forwardhandstart: false,
    forwardfootstart: false,
    reversehandstart: false,
    reversefootstart: false,
    ...options,
  };
}

function createMockRoute(
  id: number,
  name: string,
  routeHolds: RouteHold[]
): Route {
  return {
    id,
    name,
    route_holds: routeHolds,
    forward_grade: 5,
    reverse_grade: 5,
    styles: [],
  };
}

describe('BaseSceneComponent', () => {
  let component: BaseSceneComponent;
  let fixture: ComponentFixture<BaseSceneComponent>;
  let mockRouteStore: jasmine.SpyObj<RouteStore>;

  beforeEach(async () => {
    mockRouteStore = jasmine.createSpyObj('RouteStore', ['getRouteColor', 'isRouteSelected'], {
      selectedRoutes: signal<Route[]>([]),
    });
    mockRouteStore.getRouteColor.and.returnValue('#FF6B6B');

    await TestBed.configureTestingModule({
      imports: [BaseSceneComponent],
      providers: [{ provide: RouteStore, useValue: mockRouteStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseSceneComponent);
    fixture.componentRef.setInput('wallModelUrl', 'https://example.com/wall.gltf');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept wallModelUrl input', () => {
    expect(component.wallModelUrl()).toBe('https://example.com/wall.gltf');
  });

  it('should have visible default to true', () => {
    expect(component.visible()).toBe(true);
  });

  it('should render a-scene element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const scene = compiled.querySelector('a-scene');
    expect(scene).toBeTruthy();
  });

  it('should render wall-environment entity', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const wallEnv = compiled.querySelector('#wall-environment');
    expect(wallEnv).toBeTruthy();
  });

  it('should render wall-container entity', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const wallContainer = compiled.querySelector('#wall-container');
    expect(wallContainer).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE HOLD VISUALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Route Hold Visualization', () => {
    it('should expose selectedRoutes from RouteStore', () => {
      expect(component.selectedRoutes).toBeDefined();
      expect(component.selectedRoutes()).toEqual([]);
    });

    it('should compute routeHoldsToRender as empty when no routes selected', () => {
      expect(component.routeHoldsToRender()).toEqual([]);
    });

    it('should compute routeHoldsToRender from selected routes', () => {
      const hold1 = createMockHold(1, 1.0, 2.0, 3.0);
      const hold2 = createMockHold(2, 1.5, 2.5, 3.5);
      const routeHold1 = createMockRouteHold(1, hold1);
      const routeHold2 = createMockRouteHold(2, hold2);
      const route = createMockRoute(1, 'Test Route', [routeHold1, routeHold2]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered.length).toBe(2);
    });

    it('should assign green color to forward hand start holds', () => {
      const hold = createMockHold(1, 1.0, 2.0, 3.0);
      const routeHold = createMockRouteHold(1, hold, { forwardhandstart: true });
      const route = createMockRoute(1, 'Test Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered[0].color).toBe('#00FF00'); // Green
    });

    it('should assign green color to forward foot start holds', () => {
      const hold = createMockHold(1, 1.0, 2.0, 3.0);
      const routeHold = createMockRouteHold(1, hold, { forwardfootstart: true });
      const route = createMockRoute(1, 'Test Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered[0].color).toBe('#00FF00'); // Green
    });

    it('should assign cyan color to reverse hand start (end) holds', () => {
      const hold = createMockHold(1, 1.0, 2.0, 3.0);
      const routeHold = createMockRouteHold(1, hold, { reversehandstart: true });
      const route = createMockRoute(1, 'Test Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered[0].color).toBe('#20E7FF'); // Cyan
    });

    it('should assign cyan color to reverse foot start (end) holds', () => {
      const hold = createMockHold(1, 1.0, 2.0, 3.0);
      const routeHold = createMockRouteHold(1, hold, { reversefootstart: true });
      const route = createMockRoute(1, 'Test Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered[0].color).toBe('#20E7FF'); // Cyan
    });

    it('should assign white color to regular holds when single route selected', () => {
      const hold = createMockHold(1, 1.0, 2.0, 3.0);
      const routeHold = createMockRouteHold(1, hold); // No start/end flags
      const route = createMockRoute(1, 'Test Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered[0].color).toBe('#FFFFFF'); // White for regular holds
    });

    it('should assign white color to regular holds when multiple routes selected', () => {
      const hold1 = createMockHold(1, 1.0, 2.0, 3.0);
      const hold2 = createMockHold(2, 4.0, 5.0, 6.0);
      const routeHold1 = createMockRouteHold(1, hold1); // Regular hold
      const routeHold2 = createMockRouteHold(2, hold2); // Regular hold
      const route1 = createMockRoute(1, 'Route 1', [routeHold1]);
      const route2 = createMockRoute(2, 'Route 2', [routeHold2]);

      (mockRouteStore.selectedRoutes as any).set([route1, route2]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      // All regular holds should be white regardless of route count
      expect(rendered.every((h) => h.color === '#FFFFFF')).toBe(true);
    });

    it('should assign gold LINK color when hold is start in one route and end in another', () => {
      // Same hold used in both routes
      const sharedHold = createMockHold(1, 1.0, 2.0, 3.0);

      // Route 1: this hold is a START
      const routeHold1 = createMockRouteHold(1, sharedHold, { forwardhandstart: true });
      const route1 = createMockRoute(1, 'Route 1', [routeHold1]);

      // Route 2: same hold is an END
      const routeHold2 = createMockRouteHold(1, sharedHold, { reversehandstart: true });
      const route2 = createMockRoute(2, 'Route 2', [routeHold2]);

      (mockRouteStore.selectedRoutes as any).set([route1, route2]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered.length).toBe(1); // Deduplicated
      expect(rendered[0].color).toBe('#FFD700'); // Gold for link
    });

    it('should NOT assign link color when same hold is start AND end in SAME route', () => {
      const hold = createMockHold(1, 1.0, 2.0, 3.0);
      // Same route has this as both start and end (edge case)
      const routeHold = createMockRouteHold(1, hold, {
        forwardhandstart: true,
        reversehandstart: true,
      });
      const route = createMockRoute(1, 'Weird Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      // Not a link (same route), start takes precedence
      expect(rendered[0].color).toBe('#00FF00'); // Green (start)
    });

    it('should deduplicate holds that appear in multiple routes', () => {
      const sharedHold = createMockHold(1, 1.0, 2.0, 3.0);
      const routeHold1 = createMockRouteHold(1, sharedHold);
      const routeHold2 = createMockRouteHold(1, sharedHold);
      const route1 = createMockRoute(1, 'Route 1', [routeHold1]);
      const route2 = createMockRoute(2, 'Route 2', [routeHold2]);

      (mockRouteStore.selectedRoutes as any).set([route1, route2]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered.length).toBe(1); // Only one sphere for shared hold
    });

    it('should include position from hold data', () => {
      const hold = createMockHold(1, 1.5, 2.5, 3.5);
      const routeHold = createMockRouteHold(1, hold);
      const route = createMockRoute(1, 'Test Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered[0].position).toEqual({ x: 1.5, y: 2.5, z: 3.5 });
    });

    it('should skip route holds without hold data', () => {
      const routeHold: RouteHold = {
        id: 1,
        hold_id: 1,
        hold: undefined, // Missing hold data
        forwardhandstart: false,
        forwardfootstart: false,
        reversehandstart: false,
        reversefootstart: false,
      };
      const route = createMockRoute(1, 'Test Route', [routeHold]);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered.length).toBe(0);
    });

    it('should handle routes with empty route_holds array', () => {
      const route = createMockRoute(1, 'Empty Route', []);

      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      const rendered = component.routeHoldsToRender();
      expect(rendered.length).toBe(0);
    });
  });
});

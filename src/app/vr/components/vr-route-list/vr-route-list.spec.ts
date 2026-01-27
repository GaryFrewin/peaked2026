import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { VrRouteListComponent } from './vr-route-list';
import { RouteStore } from '../../../stores/route.store';
import { Route } from '../../../data-contracts/route.model';

/**
 * VR ROUTE LIST COMPONENT TESTS
 *
 * Tests for the VR-optimized route selection interface.
 * Focuses on behavior, not pixel-perfect layout.
 */

function createMockRoute(id: number, name: string, grade: number): Route {
  return {
    id,
    name,
    route_holds: [],
    forward_grade: grade,
    reverse_grade: grade,
    styles: [],
  };
}

describe('VrRouteListComponent', () => {
  let component: VrRouteListComponent;
  let fixture: ComponentFixture<VrRouteListComponent>;
  let mockRouteStore: jasmine.SpyObj<RouteStore>;

  beforeEach(async () => {
    mockRouteStore = jasmine.createSpyObj(
      'RouteStore',
      ['toggleRouteSelection', 'clearSelectedRoutes', 'isRouteSelected', 'getRouteColor'],
      {
        routes: signal<Route[]>([]),
        selectedRoutes: signal<Route[]>([]),
        isLoading: signal(false),
        error: signal<string | null>(null),
      }
    );
    mockRouteStore.isRouteSelected.and.returnValue(false);
    mockRouteStore.getRouteColor.and.returnValue('#FF6B6B');

    await TestBed.configureTestingModule({
      imports: [VrRouteListComponent],
      providers: [{ provide: RouteStore, useValue: mockRouteStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(VrRouteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPLAY STATES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Display States', () => {
    it('should show loading state when isLoading is true', () => {
      (mockRouteStore.isLoading as any).set(true);
      fixture.detectChanges();

      expect(component.showLoading()).toBe(true);
      expect(component.showRouteGrid()).toBe(false);
    });

    it('should show empty state when no routes and not loading', () => {
      (mockRouteStore.routes as any).set([]);
      (mockRouteStore.isLoading as any).set(false);
      fixture.detectChanges();

      expect(component.showEmptyState()).toBe(true);
      expect(component.showRouteGrid()).toBe(false);
    });

    it('should show route grid when routes exist', () => {
      const routes = [createMockRoute(1, 'Test Route', 5)];
      (mockRouteStore.routes as any).set(routes);
      (mockRouteStore.isLoading as any).set(false);
      fixture.detectChanges();

      expect(component.showRouteGrid()).toBe(true);
      expect(component.showEmptyState()).toBe(false);
    });

    it('should show no match state when search has no results', () => {
      const routes = [createMockRoute(1, 'Alpha Route', 5)];
      (mockRouteStore.routes as any).set(routes);
      component.searchFilter.set('zzzzz');
      fixture.detectChanges();

      expect(component.showNoMatchState()).toBe(true);
      expect(component.showRouteGrid()).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Route Selection', () => {
    it('should call toggleRouteSelection when route clicked', () => {
      const route = createMockRoute(1, 'Test Route', 5);
      component.onRouteClick(route);

      expect(mockRouteStore.toggleRouteSelection).toHaveBeenCalledWith(route);
    });

    it('should call clearSelectedRoutes when clear clicked', () => {
      component.onClearSelection();

      expect(mockRouteStore.clearSelectedRoutes).toHaveBeenCalled();
    });

    it('should show selection count when routes are selected', () => {
      const route = createMockRoute(1, 'Test Route', 5);
      (mockRouteStore.selectedRoutes as any).set([route]);
      fixture.detectChanges();

      expect(component.selectionCount()).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SEARCH FILTERING
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Search Filtering', () => {
    it('should filter routes by name', () => {
      const routes = [
        createMockRoute(1, 'Alpha Route', 5),
        createMockRoute(2, 'Beta Route', 6),
      ];
      (mockRouteStore.routes as any).set(routes);
      component.searchFilter.set('alpha');
      fixture.detectChanges();

      expect(component.filteredRoutes().length).toBe(1);
      expect(component.filteredRoutes()[0].name).toBe('Alpha Route');
    });

    it('should filter routes by grade', () => {
      const routes = [
        createMockRoute(1, 'Easy', 3),
        createMockRoute(2, 'Hard', 8),
      ];
      (mockRouteStore.routes as any).set(routes);
      component.searchFilter.set('v8');
      fixture.detectChanges();

      expect(component.filteredRoutes().length).toBe(1);
      expect(component.filteredRoutes()[0].name).toBe('Hard');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLES DISPLAY
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Styles Display', () => {
    it('should return empty string when no styles', () => {
      const route = createMockRoute(1, 'Test', 5);
      route.styles = [];

      expect(component.getStylesText(route)).toBe('');
    });

    it('should format styles with middle dot separator', () => {
      const route = createMockRoute(1, 'Test', 5);
      route.styles = [{ id: 1, name: 'Crimpy' }, { id: 2, name: 'Overhang' }];

      expect(component.getStylesText(route)).toBe('Crimpy · Overhang');
    });
  });
});

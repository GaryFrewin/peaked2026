import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { RouteListComponent } from './route-list';
import { RouteStore } from '../../../stores/route.store';
import { Route, createRoute } from '../../../data-contracts/route.model';

describe('RouteListComponent', () => {
  let component: RouteListComponent;
  let fixture: ComponentFixture<RouteListComponent>;

  // Writable signals for test manipulation
  let routesSignal: WritableSignal<Route[]>;
  let selectedRoutesSignal: WritableSignal<Route[]>;
  let isLoadingSignal: WritableSignal<boolean>;
  let errorSignal: WritableSignal<string | null>;

  const mockRoutes: Route[] = [
    createRoute({ id: 1, name: 'Crimpy Overhang', forward_grade: 4, reverse_grade: 3 }),
    createRoute({ id: 2, name: 'Slab Master', forward_grade: 2, reverse_grade: 2 }),
    createRoute({ id: 3, name: 'The Beast', forward_grade: 7, reverse_grade: 6 }),
  ];

  let mockStore: {
    routes: WritableSignal<Route[]>;
    selectedRoutes: WritableSignal<Route[]>;
    isLoading: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
    toggleRouteSelection: jasmine.Spy;
    clearSelectedRoutes: jasmine.Spy;
    isRouteSelected: jasmine.Spy;
    getRouteColor: jasmine.Spy;
  };

  beforeEach(async () => {
    // Create fresh signals for each test
    routesSignal = signal<Route[]>(mockRoutes);
    selectedRoutesSignal = signal<Route[]>([]);
    isLoadingSignal = signal(false);
    errorSignal = signal<string | null>(null);

    mockStore = {
      routes: routesSignal,
      selectedRoutes: selectedRoutesSignal,
      isLoading: isLoadingSignal,
      error: errorSignal,
      toggleRouteSelection: jasmine.createSpy('toggleRouteSelection'),
      clearSelectedRoutes: jasmine.createSpy('clearSelectedRoutes'),
      isRouteSelected: jasmine.createSpy('isRouteSelected').and.returnValue(false),
      getRouteColor: jasmine.createSpy('getRouteColor').and.returnValue('#FFFFFF'),
    };

    await TestBed.configureTestingModule({
      imports: [RouteListComponent],
      providers: [{ provide: RouteStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filtering behavior', () => {
    it('should show all routes when search is empty', () => {
      component.searchFilter.set('');
      const filtered = component.filteredRoutes();
      expect(filtered.length).toBe(3);
    });

    it('should filter routes by name', () => {
      component.searchFilter.set('slab');
      const filtered = component.filteredRoutes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Slab Master');
    });

    it('should filter routes by grade', () => {
      component.searchFilter.set('v4');
      const filtered = component.filteredRoutes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].forward_grade).toBe(4);
    });
  });

  describe('empty states', () => {
    it('should show loading state when isLoading is true', () => {
      isLoadingSignal.set(true);
      fixture.detectChanges();

      expect(component.showLoading()).toBe(true);
    });

    it('should show empty state when no routes exist', () => {
      routesSignal.set([]);
      fixture.detectChanges();

      expect(component.showEmptyState()).toBe(true);
    });

    it('should show no-match state when filter returns empty', () => {
      component.searchFilter.set('nonexistent');
      fixture.detectChanges();

      expect(component.showNoMatchState()).toBe(true);
    });
  });

  describe('selection behavior', () => {
    it('should call toggleRouteSelection when route is clicked', () => {
      component.onRouteClick(mockRoutes[0]);
      expect(mockStore.toggleRouteSelection).toHaveBeenCalledWith(mockRoutes[0]);
    });

    it('should call clearSelectedRoutes when clear button is triggered', () => {
      component.onClearSelection();
      expect(mockStore.clearSelectedRoutes).toHaveBeenCalled();
    });

    it('should show selection count when routes are selected', () => {
      selectedRoutesSignal.set([mockRoutes[0], mockRoutes[1]]);
      fixture.detectChanges();

      expect(component.selectionCount()).toBe(2);
    });
  });
});

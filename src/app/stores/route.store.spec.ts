import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { RouteStore } from './route.store';
import { RouteApi, StylesResponse } from '../data-access/route.api';
import {
  Route,
  RoutesResponse,
  RouteResponse,
  createRoute,
  createRouteHold,
} from '../data-contracts/route.model';

describe('RouteStore', () => {
  let store: RouteStore;
  let mockApi: jasmine.SpyObj<RouteApi>;

  const wallId = 1;
  const versionId = 456;

  const mockRoutes: Route[] = [
    createRoute({
      id: 101,
      name: 'Boulder Problem 1',
      wallversion_id: 456,
      forward_grade: 4,
      route_holds: [
        createRouteHold({ hold_id: 10, forwardhandstart: true }),
        createRouteHold({ hold_id: 11, reversehandstart: true }),
      ],
    }),
    createRoute({
      id: 102,
      name: 'Boulder Problem 2',
      wallversion_id: 456,
      forward_grade: 6,
    }),
    createRoute({
      id: 103,
      name: 'Boulder Problem 3',
      wallversion_id: 456,
      forward_grade: 5,
    }),
  ];

  const mockRoutesResponse: RoutesResponse = {
    success: true,
    message: 'Routes fetched',
    data: mockRoutes,
  };

  const mockStyles = [
    { id: 1, name: 'Overhang' },
    { id: 2, name: 'Slab' },
    { id: 3, name: 'Crimp' },
  ];

  const mockStylesResponse: StylesResponse = {
    success: true,
    message: 'Styles fetched',
    data: mockStyles,
  };

  beforeEach(() => {
    mockApi = jasmine.createSpyObj('RouteApi', [
      'loadRoutes',
      'loadStyles',
      'saveRoute',
      'updateRoute',
      'deleteRoute',
    ]);

    TestBed.configureTestingModule({
      providers: [RouteStore, { provide: RouteApi, useValue: mockApi }],
    });
    store = TestBed.inject(RouteStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(store.routes()).toEqual([]);
    expect(store.selectedRoute()).toBeNull();
    expect(store.selectedRoutes()).toEqual([]);
    expect(store.styles()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('loadRoutes', () => {
    it('should call API with wallId and versionId', () => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));

      store.loadRoutes(wallId, versionId);

      expect(mockApi.loadRoutes).toHaveBeenCalledWith(wallId, versionId);
    });

    it('should update routes on success', () => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));

      store.loadRoutes(wallId, versionId);

      expect(store.routes()).toEqual(mockRoutes);
      expect(store.error()).toBeNull();
    });

    it('should set isLoading during request', () => {
      const subject = new Subject<RoutesResponse>();
      mockApi.loadRoutes.and.returnValue(subject.asObservable());

      store.loadRoutes(wallId, versionId);
      expect(store.isLoading()).toBe(true);

      subject.next(mockRoutesResponse);
      subject.complete();
      expect(store.isLoading()).toBe(false);
    });

    it('should handle API errors gracefully', () => {
      const error = { statusText: 'Server Error', message: 'Network failed' };
      mockApi.loadRoutes.and.returnValue(throwError(() => error));

      store.loadRoutes(wallId, versionId);

      expect(store.routes()).toEqual([]);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toContain('Server Error');
    });

    it('should not make duplicate requests when already loading', () => {
      const subject = new Subject<RoutesResponse>();
      mockApi.loadRoutes.and.returnValue(subject.asObservable());

      store.loadRoutes(wallId, versionId);
      expect(mockApi.loadRoutes).toHaveBeenCalledTimes(1);

      store.loadRoutes(wallId, versionId); // Try again while loading
      expect(mockApi.loadRoutes).toHaveBeenCalledTimes(1);

      subject.next(mockRoutesResponse);
      subject.complete();
    });

    it('should store current wallId and versionId', () => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));

      store.loadRoutes(wallId, versionId);

      expect(store.currentWallId()).toBe(wallId);
      expect(store.currentVersionId()).toBe(versionId);
    });
  });

  describe('loadStyles', () => {
    it('should load and store available styles', () => {
      mockApi.loadStyles.and.returnValue(of(mockStylesResponse));

      store.loadStyles();

      expect(store.styles()).toEqual(mockStyles);
    });

    it('should handle styles API errors', () => {
      mockApi.loadStyles.and.returnValue(throwError(() => ({ message: 'Failed' })));

      store.loadStyles();

      expect(store.styles()).toEqual([]);
    });
  });

  describe('selectRoute', () => {
    beforeEach(() => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);
    });

    it('should set selectedRoute signal', () => {
      store.selectRoute(mockRoutes[0]);

      expect(store.selectedRoute()).toEqual(mockRoutes[0]);
    });

    it('should add to selectedRoutes array', () => {
      store.selectRoute(mockRoutes[0]);

      expect(store.selectedRoutes()).toContain(mockRoutes[0]);
    });

    it('should clear selection with null', () => {
      store.selectRoute(mockRoutes[0]);
      store.selectRoute(null);

      expect(store.selectedRoute()).toBeNull();
      expect(store.selectedRoutes()).toEqual([]);
    });
  });

  describe('toggleRouteSelection (multi-select)', () => {
    beforeEach(() => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);
    });

    it('should add route to selection if not selected', () => {
      store.toggleRouteSelection(mockRoutes[0]);

      expect(store.selectedRoutes()).toContain(mockRoutes[0]);
    });

    it('should remove route from selection if already selected', () => {
      store.toggleRouteSelection(mockRoutes[0]);
      store.toggleRouteSelection(mockRoutes[0]);

      expect(store.selectedRoutes()).not.toContain(mockRoutes[0]);
    });

    it('should allow multiple routes to be selected', () => {
      store.toggleRouteSelection(mockRoutes[0]);
      store.toggleRouteSelection(mockRoutes[1]);

      expect(store.selectedRoutes().length).toBe(2);
      expect(store.selectedRoutes()).toContain(mockRoutes[0]);
      expect(store.selectedRoutes()).toContain(mockRoutes[1]);
    });
  });

  describe('getRouteColor', () => {
    beforeEach(() => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);
    });

    it('should return consistent color for selected route', () => {
      store.toggleRouteSelection(mockRoutes[0]);

      const color1 = store.getRouteColor(mockRoutes[0]);
      const color2 = store.getRouteColor(mockRoutes[0]);

      expect(color1).toBe(color2);
      expect(color1).not.toBe('#FFFFFF');
    });

    it('should return white for unselected route', () => {
      const color = store.getRouteColor(mockRoutes[0]);

      expect(color).toBe('#FFFFFF');
    });

    it('should cycle through color palette for multiple routes', () => {
      store.toggleRouteSelection(mockRoutes[0]);
      store.toggleRouteSelection(mockRoutes[1]);
      store.toggleRouteSelection(mockRoutes[2]);

      const color1 = store.getRouteColor(mockRoutes[0]);
      const color2 = store.getRouteColor(mockRoutes[1]);
      const color3 = store.getRouteColor(mockRoutes[2]);

      expect(color1).not.toBe(color2);
      expect(color2).not.toBe(color3);
    });
  });

  describe('clearSelectedRoutes', () => {
    it('should clear all selections', () => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);

      store.selectRoute(mockRoutes[0]);
      store.toggleRouteSelection(mockRoutes[1]);
      store.clearSelectedRoutes();

      expect(store.selectedRoute()).toBeNull();
      expect(store.selectedRoutes()).toEqual([]);
    });
  });

  describe('saveRoute', () => {
    const newRoute = createRoute({ name: 'New Route', forward_grade: 5 });
    const savedRoute = createRoute({ ...newRoute, id: 999 });
    const mockSaveResponse: RouteResponse = {
      success: true,
      data: savedRoute,
    };

    beforeEach(() => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);
    });

    it('should call API and refresh routes on success', () => {
      mockApi.saveRoute.and.returnValue(of(mockSaveResponse));

      store.saveRoute(newRoute);

      expect(mockApi.saveRoute).toHaveBeenCalledWith(wallId, versionId, newRoute);
      expect(mockApi.loadRoutes).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should select the newly created route', () => {
      mockApi.saveRoute.and.returnValue(of(mockSaveResponse));

      store.saveRoute(newRoute);

      expect(store.selectedRoute()?.id).toBe(999);
    });
  });

  describe('updateRoute', () => {
    const updatedRoute = createRoute({
      id: 101,
      name: 'Updated Route',
      forward_grade: 7,
    });
    const mockUpdateResponse: RouteResponse = {
      success: true,
      data: updatedRoute,
    };

    beforeEach(() => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);
    });

    it('should call API and refresh routes on success', () => {
      mockApi.updateRoute.and.returnValue(of(mockUpdateResponse));

      store.updateRoute(updatedRoute);

      expect(mockApi.updateRoute).toHaveBeenCalledWith(wallId, versionId, updatedRoute);
      expect(mockApi.loadRoutes).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  describe('deleteRoute', () => {
    beforeEach(() => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);
    });

    it('should call API and refresh routes on success', () => {
      mockApi.deleteRoute.and.returnValue(of({ success: true }));

      store.deleteRoute(101);

      expect(mockApi.deleteRoute).toHaveBeenCalledWith(wallId, versionId, 101);
      expect(mockApi.loadRoutes).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should clear selection if deleted route was selected', () => {
      store.selectRoute(mockRoutes[0]);
      mockApi.deleteRoute.and.returnValue(of({ success: true }));

      store.deleteRoute(101); // Delete selected route

      expect(store.selectedRoute()).toBeNull();
    });
  });

  describe('computed: isRouteSelected', () => {
    beforeEach(() => {
      mockApi.loadRoutes.and.returnValue(of(mockRoutesResponse));
      store.loadRoutes(wallId, versionId);
    });

    it('should return true when route is in selectedRoutes', () => {
      store.toggleRouteSelection(mockRoutes[0]);

      expect(store.isRouteSelected(mockRoutes[0])).toBe(true);
    });

    it('should return false when route is not selected', () => {
      expect(store.isRouteSelected(mockRoutes[0])).toBe(false);
    });
  });
});

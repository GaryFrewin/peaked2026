import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { RouteApi } from './route.api';
import { environment } from '../../environments/environment';
import { Route, createRoute, createRouteHold } from '../data-contracts/route.model';

describe('RouteApi', () => {
  let api: RouteApi;
  let httpMock: HttpTestingController;

  const wallId = 1;
  const versionId = 456;

  const mockRoutesResponse = {
    success: true,
    message: 'Routes fetched',
    data: [
      {
        id: 101,
        name: 'Boulder Problem 1',
        wallversion_id: 456,
        forward_grade: 4,
        reverse_grade: 3,
        route_holds: [
          {
            id: 1,
            hold_id: 10,
            forwardhandstart: true,
            forwardfootstart: false,
            reversehandstart: false,
            reversefootstart: false,
          },
          {
            id: 2,
            hold_id: 11,
            forwardhandstart: false,
            forwardfootstart: false,
            reversehandstart: true,
            reversefootstart: false,
          },
        ],
      },
      {
        id: 102,
        name: 'Boulder Problem 2',
        wallversion_id: 456,
        forward_grade: 6,
        route_holds: [],
      },
    ],
  };

  const mockStylesResponse = {
    success: true,
    message: 'Styles fetched',
    data: [
      { id: 1, name: 'Overhang' },
      { id: 2, name: 'Slab' },
      { id: 3, name: 'Crimp' },
    ],
  };

  const mockSingleRouteResponse = {
    success: true,
    message: 'Route created',
    data: {
      id: 103,
      name: 'New Route',
      wallversion_id: 456,
      forward_grade: 5,
      route_holds: [],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RouteApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RouteApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(api).toBeTruthy();
  });

  describe('loadRoutes', () => {
    it('should make GET request to /peaked/walls/{wallId}/versions/{versionId}/routes', () => {
      api.loadRoutes(wallId, versionId).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes`
      );
      expect(req.request.method).toBe('GET');

      req.flush(mockRoutesResponse);
    });

    it('should return routes data on success', (done) => {
      api.loadRoutes(wallId, versionId).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(2);
        expect(response.data[0].name).toBe('Boulder Problem 1');
        expect(response.data[0].route_holds.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('/routes'));
      req.flush(mockRoutesResponse);
    });

    it('should propagate HTTP errors', (done) => {
      api.loadRoutes(wallId, versionId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/routes'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('loadStyles', () => {
    it('should make GET request to /peaked/route-tags', () => {
      api.loadStyles().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/peaked/route-tags`);
      expect(req.request.method).toBe('GET');

      req.flush(mockStylesResponse);
    });

    it('should return styles data on success', (done) => {
      api.loadStyles().subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(3);
        expect(response.data[0].name).toBe('Overhang');
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('/route-tags'));
      req.flush(mockStylesResponse);
    });
  });

  describe('saveRoute', () => {
    it('should make POST request with route payload', () => {
      const newRoute = createRoute({
        name: 'New Route',
        forward_grade: 5,
        route_holds: [createRouteHold({ hold_id: 10, forwardhandstart: true })],
      });

      api.saveRoute(wallId, versionId, newRoute).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('New Route');
      expect(req.request.body.forward_grade).toBe(5);

      req.flush(mockSingleRouteResponse);
    });

    it('should return created route on success', (done) => {
      const newRoute = createRoute({ name: 'New Route' });

      api.saveRoute(wallId, versionId, newRoute).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.id).toBe(103);
        expect(response.data.name).toBe('New Route');
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('/routes'));
      req.flush(mockSingleRouteResponse);
    });
  });

  describe('updateRoute', () => {
    it('should make PUT request with route payload', () => {
      const existingRoute = createRoute({
        id: 101,
        name: 'Updated Route',
        forward_grade: 7,
      });

      api.updateRoute(wallId, versionId, existingRoute).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.id).toBe(101);
      expect(req.request.body.name).toBe('Updated Route');

      req.flush({ ...mockSingleRouteResponse, data: existingRoute });
    });

    it('should return updated route on success', (done) => {
      const existingRoute = createRoute({ id: 101, name: 'Updated Route' });

      api.updateRoute(wallId, versionId, existingRoute).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.name).toBe('Updated Route');
        done();
      });

      const req = httpMock.expectOne((r) => r.url.includes('/routes'));
      req.flush({ ...mockSingleRouteResponse, data: existingRoute });
    });
  });

  describe('deleteRoute', () => {
    it('should make DELETE request to correct endpoint', () => {
      const routeId = 101;

      api.deleteRoute(wallId, versionId, routeId).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${wallId}/versions/${versionId}/routes/${routeId}`
      );
      expect(req.request.method).toBe('DELETE');

      req.flush({ success: true, message: 'Route deleted' });
    });

    it('should propagate HTTP errors', (done) => {
      api.deleteRoute(wallId, versionId, 999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/routes/999'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});

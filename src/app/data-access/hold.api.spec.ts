import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HoldApi } from './hold.api';
import { Hold, CreateHoldRequest, UpdateHoldRequest } from '../data-contracts/hold.model';
import { environment } from '../../environments/environment';

describe('HoldApi', () => {
  let api: HoldApi;
  let httpMock: HttpTestingController;

  const mockWallId = 1;
  const mockVersionId = 2;
  const mockHold: Hold = {
    id: 1,
    wall_version_id: 2,
    x: 1.0,
    y: 2.0,
    z: 0.5,
    usage_count: 5,
    date_created: '2026-01-01T00:00:00Z',
    date_modified: '2026-01-01T00:00:00Z',
  };
  const mockHolds: Hold[] = [
    mockHold,
    {
      id: 2,
      wall_version_id: 2,
      x: 1.5,
      y: 2.5,
      z: 0.5,
      usage_count: 3,
      date_created: '2026-01-01T00:00:00Z',
      date_modified: '2026-01-01T00:00:00Z',
    },
  ];
  const mockHoldsResponse = {
    data: mockHolds,
    message: 'Success',
    success: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HoldApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(HoldApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(api).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // loadHolds
  // ═══════════════════════════════════════════════════════════════════════════

  describe('loadHolds', () => {
    it('should make GET request to holds-plus endpoint', () => {
      api.loadHolds(String(mockWallId), String(mockVersionId)).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds-plus`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockHoldsResponse);
    });

    it('should return holds data on success', (done) => {
      api.loadHolds(String(mockWallId), String(mockVersionId)).subscribe((response) => {
        expect(response).toEqual(mockHoldsResponse);
        expect(response.data.length).toBe(2);
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne((req) => req.url.includes('holds-plus'));
      req.flush(mockHoldsResponse);
    });

    it('should propagate HTTP errors', (done) => {
      api.loadHolds(String(mockWallId), String(mockVersionId)).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne((req) => req.url.includes('holds-plus'));
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // createHold
  // ═══════════════════════════════════════════════════════════════════════════

  describe('createHold', () => {
    const createRequest: CreateHoldRequest = { x: 1.0, y: 2.0, z: 0.5 };

    it('should make POST request to holds endpoint', () => {
      api.createHold(mockWallId, mockVersionId, createRequest).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush({ data: mockHold, message: 'Created', success: true });
    });

    it('should return created hold on success', (done) => {
      api.createHold(mockWallId, mockVersionId, createRequest).subscribe((response) => {
        expect(response.data.id).toBe(1);
        expect(response.data.x).toBe(1.0);
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne((req) => req.method === 'POST');
      req.flush({ data: mockHold, message: 'Created', success: true });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // updateHold
  // ═══════════════════════════════════════════════════════════════════════════

  describe('updateHold', () => {
    const updateRequest: UpdateHoldRequest = { x: 2.0, y: 3.0 };

    it('should make PUT request to hold endpoint with ID', () => {
      api.updateHold(mockWallId, mockVersionId, mockHold.id, updateRequest).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds/${mockHold.id}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush({ data: { ...mockHold, ...updateRequest }, message: 'Updated', success: true });
    });

    it('should return updated hold on success', (done) => {
      api.updateHold(mockWallId, mockVersionId, mockHold.id, updateRequest).subscribe((response) => {
        expect(response.data.x).toBe(2.0);
        expect(response.data.y).toBe(3.0);
        expect(response.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne((req) => req.method === 'PUT');
      req.flush({ data: { ...mockHold, ...updateRequest }, message: 'Updated', success: true });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // deleteHold
  // ═══════════════════════════════════════════════════════════════════════════

  describe('deleteHold', () => {
    it('should make DELETE request to hold endpoint with ID', () => {
      api.deleteHold(mockWallId, mockVersionId, mockHold.id).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds/${mockHold.id}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted', success: true });
    });

    it('should return success response on delete', (done) => {
      api.deleteHold(mockWallId, mockVersionId, mockHold.id).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Deleted');
        done();
      });

      const req = httpMock.expectOne((req) => req.method === 'DELETE');
      req.flush({ message: 'Deleted', success: true });
    });

    it('should propagate 404 error when hold not found', (done) => {
      api.deleteHold(mockWallId, mockVersionId, 999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne((req) => req.method === 'DELETE');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});

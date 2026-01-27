import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HoldApi } from './hold.api';
import { Hold } from '../data-contracts/hold.model';
import { environment } from '../../environments/environment';

describe('HoldApi', () => {
  let api: HoldApi;
  let httpMock: HttpTestingController;

  const mockWallId = 'wall-123';
  const mockVersionId = 'version-456';
  const mockHolds: Hold[] = [
    {
      id: 1,
      wall_version_id: 456,
      x: 0,
      y: 1,
      z: 0,
      usage_count: 5,
      date_created: '2026-01-01T00:00:00Z',
      date_modified: '2026-01-01T00:00:00Z'
    },
    {
      id: 2,
      wall_version_id: 456,
      x: 1,
      y: 1.5,
      z: 0.1,
      usage_count: 3,
      date_created: '2026-01-01T00:00:00Z',
      date_modified: '2026-01-01T00:00:00Z'
    }
  ];
  const mockHoldsResponse = {
    data: mockHolds,
    message: 'Success',
    success: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HoldApi,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
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

  it('should make GET request to correct endpoint', () => {
    api.loadHolds(mockWallId, mockVersionId).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds-plus`
    );
    expect(req.request.method).toBe('GET');

    req.flush(mockHoldsResponse);
  });

  it('should return holds data on success', (done) => {
    api.loadHolds(mockWallId, mockVersionId).subscribe(response => {
      expect(response).toEqual(mockHoldsResponse);
      expect(response.data.length).toBe(2);
      expect(response.success).toBe(true);
      done();
    });

    const req = httpMock.expectOne(req => req.url.includes('holds-plus'));
    req.flush(mockHoldsResponse);
  });

  it('should propagate HTTP errors', (done) => {
    const errorMessage = 'Network error';

    api.loadHolds(mockWallId, mockVersionId).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Server Error');
        done();
      }
    });

    const req = httpMock.expectOne(req => req.url.includes('holds-plus'));
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });
});

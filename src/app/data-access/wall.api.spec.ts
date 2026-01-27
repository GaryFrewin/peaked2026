import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WallApi } from './wall.api';
import { environment } from '../../environments/environment';

describe('WallApi', () => {
  let api: WallApi;
  let httpMock: HttpTestingController;

  const mockWallsResponse = {
    success: true,
    message: 'Walls fetched',
    data: [
      {
        id: 1,
        name: 'Main Training Wall',
        created_by: 123,
        date_created: '2026-01-01T00:00:00Z',
        date_modified: '2026-01-01T00:00:00Z',
        wall_versions: [
          {
            id: 456,
            wall_id: 1,
            name: 'Version 1',
            model_path: 'https://example.com/models/wall-v1.glb',
            date_created: '2026-01-01T00:00:00Z',
            date_modified: '2026-01-01T00:00:00Z'
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WallApi,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    api = TestBed.inject(WallApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(api).toBeTruthy();
  });

  it('should make GET request to /peaked/walls endpoint', () => {
    api.loadWalls().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/peaked/walls`);
    expect(req.request.method).toBe('GET');

    req.flush(mockWallsResponse);
  });

  it('should return walls data on success', (done) => {
    api.loadWalls().subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.data[0].wall_versions[0].model_path).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(req => req.url.includes('/peaked/walls'));
    req.flush(mockWallsResponse);
  });

  it('should propagate HTTP errors', (done) => {
    api.loadWalls().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(401);
        done();
      }
    });

    const req = httpMock.expectOne(req => req.url.includes('/peaked/walls'));
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HoldApiService } from './hold-api.service';
import { environment } from '../../../environments/environment';

describe('HoldApiService', () => {
  let service: HoldApiService;
  let httpMock: HttpTestingController;

  const mockWallId = 'wall-123';
  const mockVersionId = 'version-456';
  const mockHoldsResponse = {
    holds: [
      { id: 1, position: { x: 0, y: 1, z: 0 }, scale: 1, color: '#ff0000' },
      { id: 2, position: { x: 1, y: 1.5, z: 0 }, scale: 0.8, color: '#00ff00' }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HoldApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(HoldApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(service.holds()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should set loading state when fetching holds', () => {
    service.loadHolds(mockWallId, mockVersionId);
    
    expect(service.isLoading()).toBe(true);
    expect(service.error()).toBeNull();
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds-plus`
    );
    expect(req.request.method).toBe('GET');
    
    req.flush(mockHoldsResponse);
  });

  it('should update holds signal on successful fetch', () => {
    service.loadHolds(mockWallId, mockVersionId);
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds-plus`
    );
    req.flush(mockHoldsResponse);
    
    expect(service.holds()).toEqual(mockHoldsResponse.holds);
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should handle API errors gracefully', () => {
    const errorMessage = 'Network error';
    
    service.loadHolds(mockWallId, mockVersionId);
    
    const req = httpMock.expectOne(
      `${environment.apiUrl}/peaked/walls/${mockWallId}/versions/${mockVersionId}/holds-plus`
    );
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    
    expect(service.holds()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toContain('Server Error');
  });

  it('should clear state when clear() is called', () => {
    // Load some data first
    service.loadHolds(mockWallId, mockVersionId);
    const req = httpMock.expectOne(req => req.url.includes('holds-plus'));
    req.flush(mockHoldsResponse);
    
    expect(service.holds().length).toBe(2);
    
    // Clear it
    service.clear();
    
    expect(service.holds()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should not make duplicate requests when already loading', () => {
    service.loadHolds(mockWallId, mockVersionId);
    service.loadHolds(mockWallId, mockVersionId); // Try to load again
    
    // Should only be one request
    const req = httpMock.expectOne(req => req.url.includes('holds-plus'));
    expect(req.request.url).toContain('holds-plus');
    
    req.flush(mockHoldsResponse);
  });
});

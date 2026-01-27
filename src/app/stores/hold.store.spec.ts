import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { HoldStore } from './hold.store';
import { HoldApi } from '../data-access/hold.api';
import { Hold, HoldsResponse } from '../data-contracts/hold.model';

describe('HoldStore', () => {
  let store: HoldStore;
  let mockApi: jasmine.SpyObj<HoldApi>;

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
  const mockHoldsResponse: HoldsResponse = {
    data: mockHolds,
    message: 'Success',
    success: true
  };

  beforeEach(() => {
    mockApi = jasmine.createSpyObj('HoldApi', ['loadHolds']);

    TestBed.configureTestingModule({
      providers: [
        HoldStore,
        { provide: HoldApi, useValue: mockApi }
      ]
    });
    store = TestBed.inject(HoldStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(store.holds()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should call API with correct parameters', () => {
    mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));

    store.loadHolds(mockWallId, mockVersionId);

    expect(mockApi.loadHolds).toHaveBeenCalledWith(mockWallId, mockVersionId);
    expect(store.error()).toBeNull();
  });

  it('should update holds signal on successful fetch', () => {
    mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));

    store.loadHolds(mockWallId, mockVersionId);

    expect(store.holds()).toEqual(mockHolds);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should handle API errors gracefully', () => {
    const error = { statusText: 'Server Error', message: 'Network failed' };
    mockApi.loadHolds.and.returnValue(throwError(() => error));

    store.loadHolds(mockWallId, mockVersionId);

    expect(store.holds()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toContain('Server Error');
  });

  it('should clear state when clear() is called', () => {
    // Load some data first
    mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));
    store.loadHolds(mockWallId, mockVersionId);

    expect(store.holds().length).toBe(2);

    // Clear it
    store.clear();

    expect(store.holds()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should not make duplicate requests when already loading', () => {
    // Use Subject to control when observable completes
    const subject = new Subject<HoldsResponse>();
    mockApi.loadHolds.and.returnValue(subject.asObservable());

    // First call starts loading
    store.loadHolds(mockWallId, mockVersionId);
    expect(mockApi.loadHolds).toHaveBeenCalledTimes(1);

    // Try to load again while still loading - should be blocked by guard
    store.loadHolds(mockWallId, mockVersionId);
    
    // Should still only have been called once
    expect(mockApi.loadHolds).toHaveBeenCalledTimes(1);
    
    // Complete the observable
    subject.next(mockHoldsResponse);
    subject.complete();
  });
});

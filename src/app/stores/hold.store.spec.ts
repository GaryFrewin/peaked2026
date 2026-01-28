import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { HoldStore } from './hold.store';
import { HoldApi } from '../data-access/hold.api';
import {
  Hold,
  HoldsResponse,
  HoldResponse,
  CreateHoldRequest,
  DeleteResponse,
} from '../data-contracts/hold.model';

describe('HoldStore', () => {
  let store: HoldStore;
  let mockApi: jasmine.SpyObj<HoldApi>;

  const mockWallId = 1;
  const mockVersionId = 2;
  const mockHold1: Hold = {
    id: 1,
    wall_version_id: 2,
    x: 0,
    y: 1,
    z: 0,
    usage_count: 5,
    date_created: '2026-01-01T00:00:00Z',
    date_modified: '2026-01-01T00:00:00Z',
  };
  const mockHold2: Hold = {
    id: 2,
    wall_version_id: 2,
    x: 1,
    y: 1.5,
    z: 0.1,
    usage_count: 3,
    date_created: '2026-01-01T00:00:00Z',
    date_modified: '2026-01-01T00:00:00Z',
  };
  const mockHolds: Hold[] = [mockHold1, mockHold2];
  const mockHoldsResponse: HoldsResponse = {
    data: mockHolds,
    message: 'Success',
    success: true,
  };

  beforeEach(() => {
    mockApi = jasmine.createSpyObj('HoldApi', [
      'loadHolds',
      'createHold',
      'updateHold',
      'deleteHold',
      'mergeHolds',
    ]);

    TestBed.configureTestingModule({
      providers: [HoldStore, { provide: HoldApi, useValue: mockApi }],
    });
    store = TestBed.inject(HoldStore);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(store.holds()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD HOLDS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('loadHolds', () => {
    it('should call API with correct parameters', () => {
      mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));

      store.loadHolds(String(mockWallId), String(mockVersionId));

      expect(mockApi.loadHolds).toHaveBeenCalledWith(String(mockWallId), String(mockVersionId));
      expect(store.error()).toBeNull();
    });

    it('should update holds signal on successful fetch', () => {
      mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));

      store.loadHolds(String(mockWallId), String(mockVersionId));

      expect(store.holds()).toEqual(mockHolds);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle API errors gracefully', () => {
      const error = { statusText: 'Server Error', message: 'Network failed' };
      mockApi.loadHolds.and.returnValue(throwError(() => error));

      store.loadHolds(String(mockWallId), String(mockVersionId));

      expect(store.holds()).toEqual([]);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toContain('Server Error');
    });

    it('should not make duplicate requests when already loading', () => {
      const subject = new Subject<HoldsResponse>();
      mockApi.loadHolds.and.returnValue(subject.asObservable());

      store.loadHolds(String(mockWallId), String(mockVersionId));
      expect(mockApi.loadHolds).toHaveBeenCalledTimes(1);

      store.loadHolds(String(mockWallId), String(mockVersionId));
      expect(mockApi.loadHolds).toHaveBeenCalledTimes(1);

      subject.next(mockHoldsResponse);
      subject.complete();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE HOLD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('createHold', () => {
    const createRequest: CreateHoldRequest = { x: 2.0, y: 3.0, z: 0.5 };
    const createdHold: Hold = {
      id: 100,
      wall_version_id: 2,
      x: 2.0,
      y: 3.0,
      z: 0.5,
      usage_count: 0,
      date_created: '2026-01-27T00:00:00Z',
      date_modified: '2026-01-27T00:00:00Z',
    };

    beforeEach(() => {
      // Pre-load some holds
      mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));
      store.loadHolds(String(mockWallId), String(mockVersionId));
    });

    it('should add hold optimistically with temp ID', () => {
      const subject = new Subject<HoldResponse>();
      mockApi.createHold.and.returnValue(subject.asObservable());

      store.createHold(mockWallId, mockVersionId, createRequest);

      // Should immediately add a hold with temp ID (negative)
      const holds = store.holds();
      expect(holds.length).toBe(3);
      const tempHold = holds.find((h) => h.id < 0);
      expect(tempHold).toBeTruthy();
      expect(tempHold?.x).toBe(2.0);
    });

    it('should replace temp ID with server ID on success', () => {
      mockApi.createHold.and.returnValue(
        of({ data: createdHold, message: 'Created', success: true })
      );

      store.createHold(mockWallId, mockVersionId, createRequest);

      const holds = store.holds();
      expect(holds.length).toBe(3);
      expect(holds.find((h) => h.id === 100)).toBeTruthy();
      expect(holds.find((h) => h.id < 0)).toBeFalsy();
    });

    it('should remove hold on API failure', () => {
      mockApi.createHold.and.returnValue(throwError(() => ({ status: 500 })));

      store.createHold(mockWallId, mockVersionId, createRequest);

      // Should rollback - only original holds remain
      expect(store.holds().length).toBe(2);
      expect(store.error()).toContain('Failed to create hold');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE HOLD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('updateHold', () => {
    const updatedPosition = { x: 5.0, y: 6.0 };

    beforeEach(() => {
      mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));
      store.loadHolds(String(mockWallId), String(mockVersionId));
    });

    it('should update hold position optimistically', () => {
      const subject = new Subject<HoldResponse>();
      mockApi.updateHold.and.returnValue(subject.asObservable());

      store.updateHold(mockWallId, mockVersionId, 1, updatedPosition);

      const hold = store.holds().find((h) => h.id === 1);
      expect(hold?.x).toBe(5.0);
      expect(hold?.y).toBe(6.0);
    });

    it('should rollback on API failure', () => {
      mockApi.updateHold.and.returnValue(throwError(() => ({ status: 500 })));

      store.updateHold(mockWallId, mockVersionId, 1, updatedPosition);

      // Should rollback to original position
      const hold = store.holds().find((h) => h.id === 1);
      expect(hold?.x).toBe(0); // Original value
      expect(hold?.y).toBe(1); // Original value
      expect(store.error()).toContain('Failed to update hold');
    });

    it('should apply server response on success', () => {
      const serverHold = { ...mockHold1, x: 5.0, y: 6.0, date_modified: '2026-01-27T12:00:00Z' };
      mockApi.updateHold.and.returnValue(of({ data: serverHold, message: 'Updated', success: true }));

      store.updateHold(mockWallId, mockVersionId, 1, updatedPosition);

      const hold = store.holds().find((h) => h.id === 1);
      expect(hold?.date_modified).toBe('2026-01-27T12:00:00Z');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE HOLD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('deleteHold', () => {
    beforeEach(() => {
      mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));
      store.loadHolds(String(mockWallId), String(mockVersionId));
    });

    it('should remove hold optimistically', () => {
      const subject = new Subject<DeleteResponse>();
      mockApi.deleteHold.and.returnValue(subject.asObservable());

      store.deleteHold(mockWallId, mockVersionId, 1);

      expect(store.holds().length).toBe(1);
      expect(store.holds().find((h) => h.id === 1)).toBeFalsy();
    });

    it('should restore hold on API failure', () => {
      mockApi.deleteHold.and.returnValue(throwError(() => ({ status: 500 })));

      store.deleteHold(mockWallId, mockVersionId, 1);

      // Should restore the hold
      expect(store.holds().length).toBe(2);
      expect(store.holds().find((h) => h.id === 1)).toBeTruthy();
      expect(store.error()).toContain('Failed to delete hold');
    });

    it('should keep hold removed on success', () => {
      mockApi.deleteHold.and.returnValue(of({ message: 'Deleted', success: true }));

      store.deleteHold(mockWallId, mockVersionId, 1);

      expect(store.holds().length).toBe(1);
      expect(store.holds().find((h) => h.id === 1)).toBeFalsy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEAR
  // ═══════════════════════════════════════════════════════════════════════════

  describe('clear', () => {
    it('should clear state when clear() is called', () => {
      mockApi.loadHolds.and.returnValue(of(mockHoldsResponse));
      store.loadHolds(String(mockWallId), String(mockVersionId));
      expect(store.holds().length).toBe(2);

      store.clear();

      expect(store.holds()).toEqual([]);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MERGE HOLDS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('mergeHolds', () => {
    const mockHold3: Hold = {
      id: 3,
      wall_version_id: 2,
      x: 2,
      y: 2,
      z: 0.2,
      usage_count: 1,
      date_created: '2026-01-01T00:00:00Z',
      date_modified: '2026-01-01T00:00:00Z',
    };
    
    const mergedHold: Hold = {
      id: 100,
      wall_version_id: 2,
      x: 0.5, // Average of hold1 and hold2
      y: 1.25,
      z: 0.05,
      usage_count: 8, // Sum of usage counts
      date_created: '2026-01-27T00:00:00Z',
      date_modified: '2026-01-27T00:00:00Z',
    };

    beforeEach(() => {
      // Pre-load holds
      mockApi.loadHolds.and.returnValue(of({
        data: [mockHold1, mockHold2, mockHold3],
        message: 'Success',
        success: true,
      }));
      store.loadHolds(String(mockWallId), String(mockVersionId));
    });

    it('should reject merge with less than 2 holds', () => {
      store.mergeHolds(mockWallId, mockVersionId, [1], 'average');

      expect(mockApi.mergeHolds).not.toHaveBeenCalled();
      expect(store.error()).toBe('Need at least 2 holds to merge');
    });

    it('should optimistically remove merged holds immediately', () => {
      const subject = new Subject<HoldResponse>();
      mockApi.mergeHolds.and.returnValue(subject.asObservable());

      // Verify initial state: 3 holds
      expect(store.holds().length).toBe(3);
      expect(store.holds().map(h => h.id)).toEqual([1, 2, 3]);

      // Merge holds 1 and 2
      store.mergeHolds(mockWallId, mockVersionId, [1, 2], 'average');

      // Holds 1 and 2 should be removed immediately (optimistic)
      expect(store.holds().length).toBe(1);
      expect(store.holds().map(h => h.id)).toEqual([3]);
      expect(store.holds().find(h => h.id === 1)).toBeUndefined();
      expect(store.holds().find(h => h.id === 2)).toBeUndefined();
    });

    it('should add merged hold when API responds', () => {
      mockApi.mergeHolds.and.returnValue(of({
        data: mergedHold,
        message: 'Merged successfully',
        success: true,
      }));

      // Merge holds 1 and 2
      store.mergeHolds(mockWallId, mockVersionId, [1, 2], 'average');

      // Should have hold 3 and the new merged hold
      expect(store.holds().length).toBe(2);
      expect(store.holds().map(h => h.id)).toContain(3);
      expect(store.holds().map(h => h.id)).toContain(100);
      expect(store.holds().find(h => h.id === 100)).toEqual(mergedHold);
    });

    it('should clear error on successful merge', () => {
      mockApi.mergeHolds.and.returnValue(of({
        data: mergedHold,
        message: 'Merged',
        success: true,
      }));

      store.mergeHolds(mockWallId, mockVersionId, [1, 2], 'average');

      expect(store.error()).toBeNull();
    });

    it('should rollback on API failure', () => {
      mockApi.mergeHolds.and.returnValue(throwError(() => ({
        statusText: 'Server Error',
        message: 'Merge failed',
      })));

      // Verify initial state
      expect(store.holds().length).toBe(3);

      // Attempt merge
      store.mergeHolds(mockWallId, mockVersionId, [1, 2], 'average');

      // Should restore original holds after error
      expect(store.holds().length).toBe(3);
      expect(store.holds().map(h => h.id)).toEqual([3, 1, 2]); // Order may differ due to rollback
      expect(store.holds().find(h => h.id === 1)).toBeTruthy();
      expect(store.holds().find(h => h.id === 2)).toBeTruthy();
      expect(store.error()).toContain('Failed to merge holds');
    });

    it('should call API with correct parameters', () => {
      mockApi.mergeHolds.and.returnValue(of({
        data: mergedHold,
        message: 'Merged',
        success: true,
      }));

      store.mergeHolds(mockWallId, mockVersionId, [1, 2], 'master');

      expect(mockApi.mergeHolds).toHaveBeenCalledWith(
        mockWallId,
        mockVersionId,
        [1, 2],
        'master'
      );
    });
  });
});

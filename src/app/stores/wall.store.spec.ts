import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { WallStore } from './wall.store';
import { WallApi } from '../data-access/wall.api';
import { Wall, WallsResponse } from '../data-contracts/wall.model';

describe('WallStore', () => {
  let store: WallStore;
  let mockApi: jasmine.SpyObj<WallApi>;

  const mockWalls: Wall[] = [
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
    },
    {
      id: 2,
      name: 'Secondary Wall',
      created_by: 123,
      date_created: '2026-01-02T00:00:00Z',
      date_modified: '2026-01-02T00:00:00Z',
      wall_versions: []
    }
  ];

  const mockResponse: WallsResponse = {
    success: true,
    message: 'Walls fetched',
    data: mockWalls
  };

  beforeEach(() => {
    mockApi = jasmine.createSpyObj('WallApi', ['loadWalls']);

    TestBed.configureTestingModule({
      providers: [
        WallStore,
        { provide: WallApi, useValue: mockApi }
      ]
    });
    store = TestBed.inject(WallStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(store.walls()).toEqual([]);
    expect(store.selectedWall()).toBeNull();
    expect(store.selectedVersion()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should call API and update walls on loadWalls', () => {
    mockApi.loadWalls.and.returnValue(of(mockResponse));

    store.loadWalls();

    expect(store.walls()).toEqual(mockWalls);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should handle API errors gracefully', () => {
    const error = { statusText: 'Server Error', message: 'Network failed' };
    mockApi.loadWalls.and.returnValue(throwError(() => error));

    store.loadWalls();

    expect(store.walls()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toContain('Server Error');
  });

  it('should not make duplicate requests when already loading', () => {
    const subject = new Subject<WallsResponse>();
    mockApi.loadWalls.and.returnValue(subject.asObservable());

    store.loadWalls();
    expect(mockApi.loadWalls).toHaveBeenCalledTimes(1);

    store.loadWalls(); // Try again while loading
    expect(mockApi.loadWalls).toHaveBeenCalledTimes(1);

    subject.next(mockResponse);
    subject.complete();
  });

  it('should select wall by id', () => {
    mockApi.loadWalls.and.returnValue(of(mockResponse));
    store.loadWalls();

    store.selectWall(1);

    expect(store.selectedWall()).toEqual(mockWalls[0]);
  });

  it('should select version by id', () => {
    mockApi.loadWalls.and.returnValue(of(mockResponse));
    store.loadWalls();
    store.selectWall(1);

    store.selectVersion(456);

    expect(store.selectedVersion()).toEqual(mockWalls[0].wall_versions[0]);
  });

  it('should provide modelPath from selected version', () => {
    mockApi.loadWalls.and.returnValue(of(mockResponse));
    store.loadWalls();
    store.selectWall(1);
    store.selectVersion(456);

    expect(store.modelPath()).toBe('https://example.com/models/wall-v1.glb');
  });

  it('should return null modelPath when no version selected', () => {
    expect(store.modelPath()).toBeNull();
  });

  it('should clear state when clear() is called', () => {
    mockApi.loadWalls.and.returnValue(of(mockResponse));
    store.loadWalls();
    store.selectWall(1);
    store.selectVersion(456);

    store.clear();

    expect(store.walls()).toEqual([]);
    expect(store.selectedWall()).toBeNull();
    expect(store.selectedVersion()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});

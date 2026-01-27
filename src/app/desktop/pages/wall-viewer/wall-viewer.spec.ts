import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { WallViewerComponent } from './wall-viewer';
import { WallStore } from '../../../stores/wall.store';
import { HoldStore } from '../../../stores/hold.store';
import { RouteStore } from '../../../stores/route.store';
import { signal } from '@angular/core';

describe('WallViewerComponent', () => {
  let component: WallViewerComponent;
  let fixture: ComponentFixture<WallViewerComponent>;

  beforeEach(async () => {
    const mockWallStore = {
      walls: signal([]),
      selectedWall: signal(null),
      modelPath: signal(null),
      isLoading: signal(false),
      loadWalls: jasmine.createSpy('loadWalls'),
      selectWall: jasmine.createSpy('selectWall'),
      selectVersion: jasmine.createSpy('selectVersion'),
    };

    const mockHoldStore = {
      holds: signal([]),
      isLoading: signal(false),
      loadHolds: jasmine.createSpy('loadHolds'),
    };

    const mockRouteStore = {
      routes: signal([]),
      selectedRoutes: signal([]),
      isLoading: signal(false),
      loadRoutes: jasmine.createSpy('loadRoutes'),
    };

    await TestBed.configureTestingModule({
      imports: [WallViewerComponent],
      providers: [
        { provide: WallStore, useValue: mockWallStore },
        { provide: HoldStore, useValue: mockHoldStore },
        { provide: RouteStore, useValue: mockRouteStore },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WallViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { VrClimbingComponent } from './vr-climbing';
import { WallStore } from '../../../stores/wall.store';
import { HoldStore } from '../../../stores/hold.store';
import { RouteStore } from '../../../stores/route.store';
import { SettingsStore } from '../../../stores/settings.store';
import { VrSettingsApplier } from '../../services/vr-settings-applier';

describe('VrClimbingComponent', () => {
  let component: VrClimbingComponent;
  let fixture: ComponentFixture<VrClimbingComponent>;

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

    const mockSettingsStore = {
      skyboxOptions: [],
      selectedSkyboxPath: signal(''),
      occludeSkybox: signal(true),
      holdsVisible: signal(true),
      wallOpacity: signal(0),
      setSkybox: jasmine.createSpy('setSkybox'),
      setOccludeSkybox: jasmine.createSpy('setOccludeSkybox'),
      setHoldsVisible: jasmine.createSpy('setHoldsVisible'),
      setWallOpacity: jasmine.createSpy('setWallOpacity'),
    };

    const mockVrSettingsApplier = {
      attachTo: jasmine.createSpy('attachTo'),
    };

    await TestBed.configureTestingModule({
      imports: [VrClimbingComponent],
      providers: [
        { provide: WallStore, useValue: mockWallStore },
        { provide: HoldStore, useValue: mockHoldStore },
        { provide: RouteStore, useValue: mockRouteStore },
        { provide: SettingsStore, useValue: mockSettingsStore },
        { provide: VrSettingsApplier, useValue: mockVrSettingsApplier },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(VrClimbingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

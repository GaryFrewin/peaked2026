import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { VrClimbingComponent } from './vr-climbing';
import { WallStore } from '../../../stores/wall.store';
import { HoldStore } from '../../../stores/hold.store';

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

    await TestBed.configureTestingModule({
      imports: [VrClimbingComponent],
      providers: [
        { provide: WallStore, useValue: mockWallStore },
        { provide: HoldStore, useValue: mockHoldStore },
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

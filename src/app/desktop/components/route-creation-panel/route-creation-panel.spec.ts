import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouteCreationPanelComponent } from './route-creation-panel';
import { CreateRouteStateStore } from '../../../stores/create-route-state.store';
import { RouteStore } from '../../../stores/route.store';
import { HoldStore } from '../../../stores/hold.store';
import { WallStore } from '../../../stores/wall.store';
import { ModeStore } from '../../../stores/mode.store';
import { RouteNameGeneratorService } from '../../../shared/services/route-name-generator.service';

describe('RouteCreationPanelComponent', () => {
  let component: RouteCreationPanelComponent;
  let fixture: ComponentFixture<RouteCreationPanelComponent>;
  let mockRouteStore: any;

  beforeEach(() => {
    const mockCreateRouteState = {
      draftRoute: signal(null),
      removeHold: jasmine.createSpy('removeHold'),
      cycleHoldFlags: jasmine.createSpy('cycleHoldFlags'),
    };

    mockRouteStore = {
      styles: signal([]),
      saveRoute: jasmine.createSpy('saveRoute'),
      loadStyles: jasmine.createSpy('loadStyles'),
    };

    const mockHoldStore = {
      holds: signal([]),
    };

    const mockWallStore = {
      selectedWallId: signal(1),
      selectedVersionId: signal(1),
    };

    const mockModeStore = {
      exitToView: jasmine.createSpy('exitToView'),
    };

    const mockNameGenerator = {
      generateRouteName: jasmine.createSpy('generateRouteName').and.returnValue('Test Route Name'),
    };

    TestBed.configureTestingModule({
      imports: [RouteCreationPanelComponent],
      providers: [
        { provide: CreateRouteStateStore, useValue: mockCreateRouteState },
        { provide: RouteStore, useValue: mockRouteStore },
        { provide: HoldStore, useValue: mockHoldStore },
        { provide: WallStore, useValue: mockWallStore },
        { provide: ModeStore, useValue: mockModeStore },
        { provide: RouteNameGeneratorService, useValue: mockNameGenerator },
      ],
    });

    fixture = TestBed.createComponent(RouteCreationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should_initialize_with_random_route_name', () => {
    /** Form should start with a randomly generated name so users don't need to think of one. */
    expect(component.routeName()).toBe('Test Route Name');
  });

  it('should_load_styles_on_initialization', () => {
    /** Styles should be fetched from API so users can tag their routes. */
    expect(mockRouteStore.loadStyles).toHaveBeenCalled();
  });

  it('should_default_forward_grade_to_zero', () => {
    expect(component.forwardGrade()).toBe(0);
  });

  it('should_default_reverse_grade_to_zero', () => {
    expect(component.reverseGrade()).toBe(0);
  });

  it('should show 0 holds initially', () => {
    expect(component.holdCount()).toBe(0);
  });

  it('should disable save when no name', () => {
    component.routeName.set('');
    expect(component.canSave()).toBe(false);
  });
});

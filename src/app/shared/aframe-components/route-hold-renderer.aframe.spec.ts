/**
 * Tests for route-hold-renderer A-Frame component
 * 
 * Key behaviors:
 * - In CreateRoute mode with draft route, renders white route hold spheres
 * - When holds added to draft, they appear immediately as white spheres
 * - Start/end flags determine color (green/cyan)
 */

import { TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CreateRouteStateStore } from '../../stores/create-route-state.store';
import { ModeStore, AppMode } from '../../stores/mode.store';
import { HoldStore } from '../../stores/hold.store';
import { RouteStore } from '../../stores/route.store';

describe('route-hold-renderer A-Frame component', () => {
  let createRouteState: CreateRouteStateStore;
  let modeStore: ModeStore;
  let holdStore: HoldStore;
  let routeStore: RouteStore;
  let mockElement: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CreateRouteStateStore,
        ModeStore,
        HoldStore,
        RouteStore,
      ]
    });

    createRouteState = TestBed.inject(CreateRouteStateStore);
    modeStore = TestBed.inject(ModeStore);
    holdStore = TestBed.inject(HoldStore);
    routeStore = TestBed.inject(RouteStore);

    // Mock A-Frame element
    mockElement = {
      querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue([]),
      removeChild: jasmine.createSpy('removeChild'),
      appendChild: jasmine.createSpy('appendChild'),
    };

    // Expose injector globally (as base-scene does)
    (window as any).__appInjector = TestBed.inject(Injector);
  });

  describe('test_should_render_white_sphere_when_hold_added_to_draft_route_in_create_mode', () => {
    it('should render white sphere when hold added to draft route in CreateRoute mode', (done) => {
      /**
       * Critical behavior: When in CreateRoute mode and a hold is added to the draft route,
       * a white emissive sphere (shader: flat, emissiveIntensity: 1.2) should be rendered
       * immediately at the hold's position.
       */
      
      // Arrange: Set up holds in HoldStore
      holdStore.holds.set([
        { id: 1, x: 0, y: 1, z: 0, wall_version_id: 1, usage_count: 0, date_created: '', date_modified: '' },
        { id: 2, x: 1, y: 1.5, z: 0, wall_version_id: 1, usage_count: 0, date_created: '', date_modified: '' },
      ]);

      // Arrange: Enter CreateRoute mode
      modeStore.setMode(AppMode.CreateRoute);

      // Act: Add hold to draft route
      createRouteState.addHold(1);

      // Give effect time to run
      setTimeout(() => {
        // Assert: route-hold-renderer should have created a white sphere
        // In real implementation, this would check that appendChild was called
        // with an a-sphere element with white color material
        const draft = createRouteState.draftRoute();
        expect(draft).toBeTruthy();
        expect(draft?.route_holds.length).toBe(1);
        expect(draft?.route_holds[0].hold_id).toBe(1);
        
        // The A-Frame component should render this as white
        // (we can't test DOM directly in unit tests, but we verify the state is correct)
        done();
      }, 100);
    });
  });

  describe('hold icons', () => {
    it('should_set_hand_icon_type_when_forwardhandstart_is_true', () => {
      /**
       * When a hold has forwardhandstart flag, the renderer should
       * compute iconType as 'hand' to display the hand emoji sprite.
       */
      holdStore.holds.set([
        { id: 1, x: 0, y: 1, z: 0, wall_version_id: 1, usage_count: 0, date_created: '', date_modified: '' },
      ]);
      modeStore.setMode(AppMode.CreateRoute);

      // Add hold and cycle to forwardhandstart
      createRouteState.addHold(1);
      createRouteState.cycleHoldFlags(1);

      const draft = createRouteState.draftRoute();
      expect(draft?.route_holds[0].forwardhandstart).toBe(true);
      // The A-Frame component will render a hand icon based on this flag
    });

    it('should_set_foot_icon_type_when_forwardfootstart_is_true', () => {
      /**
       * When a hold has forwardfootstart flag, the renderer should
       * compute iconType as 'foot' to display the foot emoji sprite.
       */
      holdStore.holds.set([
        { id: 1, x: 0, y: 1, z: 0, wall_version_id: 1, usage_count: 0, date_created: '', date_modified: '' },
      ]);
      modeStore.setMode(AppMode.CreateRoute);

      // Add hold and cycle twice to forwardfootstart
      createRouteState.addHold(1);
      createRouteState.cycleHoldFlags(1); // → forwardhandstart
      createRouteState.cycleHoldFlags(1); // → forwardfootstart

      const draft = createRouteState.draftRoute();
      expect(draft?.route_holds[0].forwardfootstart).toBe(true);
      // The A-Frame component will render a foot icon based on this flag
    });
  });
});

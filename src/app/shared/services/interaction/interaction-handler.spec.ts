import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InteractionHandler } from './interaction-handler';
import { InteractionBus } from './interaction-bus';
import { ModeStore, AppMode } from '../../../stores/mode.store';
import { HoldStore } from '../../../stores/hold.store';
import { WallStore } from '../../../stores/wall.store';
import { EditHoldStateStore } from '../../../stores/edit-hold-state.store';
import { CreateRouteStateStore } from '../../../stores/create-route-state.store';

describe('InteractionHandler', () => {
  let handler: InteractionHandler;
  let bus: InteractionBus;
  let modeStore: ModeStore;
  let createRouteState: CreateRouteStateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InteractionHandler,
        InteractionBus,
        ModeStore,
        HoldStore,
        WallStore,
        EditHoldStateStore,
        CreateRouteStateStore,
      ],
    });

    handler = TestBed.inject(InteractionHandler);
    bus = TestBed.inject(InteractionBus);
    modeStore = TestBed.inject(ModeStore);
    createRouteState = TestBed.inject(CreateRouteStateStore);
  });

  describe('Hold Right-Click in CreateRoute Mode', () => {
    it('should_cycle_hold_flags_without_toggling_route_membership', () => {
      // Arrange: Set mode to CreateRoute and add a hold to the route
      modeStore.setMode(AppMode.CreateRoute);
      createRouteState.addHold(42);
      
      const initialDraft = createRouteState.draftRoute();
      expect(initialDraft?.route_holds.length).toBe(1);
      expect(initialDraft?.route_holds[0].hold_id).toBe(42);
      
      spyOn(createRouteState, 'cycleHoldFlags');
      spyOn(createRouteState, 'removeHold');
      spyOn(createRouteState, 'addHold');

      // Act: Right-click the hold
      bus.emitHoldRightClicked(42);

      // Assert: cycleHoldFlags should be called, but NOT addHold or removeHold
      expect(createRouteState.cycleHoldFlags).toHaveBeenCalledWith(42);
      expect(createRouteState.removeHold).not.toHaveBeenCalled();
      expect(createRouteState.addHold).not.toHaveBeenCalled();
    });
  });

  describe('Hold Left-Click in CreateRoute Mode', () => {
    it('should_add_hold_when_not_in_route', () => {
      // Arrange: Set mode to CreateRoute with no holds
      modeStore.setMode(AppMode.CreateRoute);

      // Act: Left-click a hold
      bus.emitHoldClicked(42);

      // Assert: Hold should be added to the route
      const updatedDraft = createRouteState.draftRoute();
      expect(updatedDraft).toBeTruthy();
      expect(updatedDraft?.route_holds.length).toBe(1);
      expect(updatedDraft?.route_holds[0].hold_id).toBe(42);
    });

    it('should_remove_hold_when_already_in_route', () => {
      // Arrange: Set mode to CreateRoute with a hold already in the route
      modeStore.setMode(AppMode.CreateRoute);
      createRouteState.addHold(42);
      
      const initialDraft = createRouteState.draftRoute();
      expect(initialDraft?.route_holds.length).toBe(1);

      // Act: Left-click the same hold
      bus.emitHoldClicked(42);

      // Assert: Hold should be removed from the route
      const updatedDraft = createRouteState.draftRoute();
      expect(updatedDraft?.route_holds.length).toBe(0);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { ModeStore, AppMode } from './mode.store';
import { EditHoldStateStore } from './edit-hold-state.store';

describe('ModeStore', () => {
  let store: ModeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ModeStore);
  });

  describe('initial state', () => {
    it('should start in view mode', () => {
      expect(store.mode()).toBe(AppMode.View);
    });
  });

  describe('setMode', () => {
    it('should change mode to EditHolds', () => {
      store.setMode(AppMode.EditHolds);
      expect(store.mode()).toBe(AppMode.EditHolds);
    });

    it('should change mode to CreateRoute', () => {
      store.setMode(AppMode.CreateRoute);
      expect(store.mode()).toBe(AppMode.CreateRoute);
    });

    it('should change mode to EditRoute', () => {
      store.setMode(AppMode.EditRoute);
      expect(store.mode()).toBe(AppMode.EditRoute);
    });
  });

  describe('computed properties', () => {
    it('isEditHoldsMode should be true when in EditHolds mode', () => {
      store.setMode(AppMode.EditHolds);
      expect(store.isEditHoldsMode()).toBe(true);
    });

    it('isEditHoldsMode should be false when in View mode', () => {
      store.setMode(AppMode.View);
      expect(store.isEditHoldsMode()).toBe(false);
    });

    it('isRouteMode should be true when in CreateRoute mode', () => {
      store.setMode(AppMode.CreateRoute);
      expect(store.isRouteMode()).toBe(true);
    });

    it('isRouteMode should be true when in EditRoute mode', () => {
      store.setMode(AppMode.EditRoute);
      expect(store.isRouteMode()).toBe(true);
    });

    it('isRouteMode should be false when in View mode', () => {
      store.setMode(AppMode.View);
      expect(store.isRouteMode()).toBe(false);
    });

    it('isViewMode should be true when in View mode', () => {
      expect(store.isViewMode()).toBe(true);
    });

    it('isViewMode should be false when in EditHolds mode', () => {
      store.setMode(AppMode.EditHolds);
      expect(store.isViewMode()).toBe(false);
    });
  });

  describe('exitToView', () => {
    it('should return to View mode from any mode', () => {
      store.setMode(AppMode.EditHolds);
      store.exitToView();
      expect(store.mode()).toBe(AppMode.View);
    });
  });

  describe('clearing edit hold state', () => {
    let editHoldState: EditHoldStateStore;

    beforeEach(() => {
      editHoldState = TestBed.inject(EditHoldStateStore);
    });

    it('should clear edit hold state when leaving EditHolds mode', () => {
      // Arrange: set up some selected holds
      store.setMode(AppMode.EditHolds);
      editHoldState.selectedHoldIds.set(new Set([1, 2, 3]));
      expect(editHoldState.selectedHoldIds().size).toBe(3);

      // Act: leave EditHolds mode
      store.setMode(AppMode.View);

      // Assert: selected holds should be cleared
      expect(editHoldState.selectedHoldIds().size).toBe(0);
    });

    it('should clear edit hold state when switching from EditHolds to CreateRoute', () => {
      // Arrange
      store.setMode(AppMode.EditHolds);
      editHoldState.selectedHoldIds.set(new Set([1, 2, 3]));

      // Act
      store.setMode(AppMode.CreateRoute);

      // Assert
      expect(editHoldState.selectedHoldIds().size).toBe(0);
    });

    it('should NOT clear edit hold state when staying in EditHolds mode', () => {
      // Arrange
      store.setMode(AppMode.EditHolds);
      editHoldState.selectedHoldIds.set(new Set([1, 2, 3]));

      // Act: "change" to EditHolds mode again
      store.setMode(AppMode.EditHolds);

      // Assert: should still have selected holds
      expect(editHoldState.selectedHoldIds().size).toBe(3);
    });

    it('should NOT clear edit hold state when switching between non-EditHolds modes', () => {
      // Arrange: set up state in EditHolds, then switch to View
      store.setMode(AppMode.EditHolds);
      editHoldState.selectedHoldIds.set(new Set([1, 2, 3]));
      store.setMode(AppMode.View);
      expect(editHoldState.selectedHoldIds().size).toBe(0);

      // Add some state again while in View mode (shouldn't happen in real app, but test the logic)
      editHoldState.selectedHoldIds.set(new Set([4, 5, 6]));

      // Act: switch from View to CreateRoute (neither is EditHolds)
      store.setMode(AppMode.CreateRoute);

      // Assert: should NOT have cleared (we only clear when leaving EditHolds)
      expect(editHoldState.selectedHoldIds().size).toBe(3);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { ModeStore, AppMode } from './mode.store';

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
});

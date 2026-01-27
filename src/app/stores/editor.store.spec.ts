import { TestBed } from '@angular/core/testing';
import { EditorStore, EditorMode } from './editor.store';
import { Route, RouteHold, createRouteHold } from '../data-contracts/route.model';
import { Hold } from '../data-contracts/hold.model';

describe('EditorStore', () => {
  let store: EditorStore;

  // Test fixtures
  const mockHold1: Hold = {
    id: 1,
    wall_version_id: 1,
    x: 1.0,
    y: 2.0,
    z: 0.5,
    usage_count: 3,
    date_created: '2026-01-01',
    date_modified: '2026-01-01',
  };

  const mockHold2: Hold = {
    id: 2,
    wall_version_id: 1,
    x: 1.5,
    y: 2.5,
    z: 0.5,
    usage_count: 1,
    date_created: '2026-01-01',
    date_modified: '2026-01-01',
  };

  const mockRoute: Route = {
    id: 10,
    name: 'Test Route',
    wallversion_id: 1,
    route_holds: [
      createRouteHold({ hold_id: 1, hold: mockHold1, forwardhandstart: true }),
      createRouteHold({ hold_id: 2, hold: mockHold2 }),
    ],
    forward_grade: 5,
    styles: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EditorStore],
    });
    store = TestBed.inject(EditorStore);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  describe('mode management', () => {
    it('should initialize in view mode', () => {
      expect(store.mode()).toBe('view');
    });

    it('should switch to editHolds mode', () => {
      store.enterEditHoldsMode();
      expect(store.mode()).toBe('editHolds');
    });

    it('should switch to createRoute mode', () => {
      store.enterCreateRouteMode();
      expect(store.mode()).toBe('createRoute');
    });

    it('should switch to editRoute mode with route data', () => {
      store.enterEditRouteMode(mockRoute);
      expect(store.mode()).toBe('editRoute');
      expect(store.routeInProgress()).toBeTruthy();
      expect(store.routeInProgress()?.name).toBe('Test Route');
    });

    it('should return to view mode when exiting any edit mode', () => {
      store.enterEditHoldsMode();
      store.exitEditMode();
      expect(store.mode()).toBe('view');

      store.enterCreateRouteMode();
      store.exitEditMode();
      expect(store.mode()).toBe('view');
    });

    it('should clear selections when changing modes', () => {
      store.selectHold(1);
      store.selectHold(2, true); // multi-select to have both
      expect(store.selectedHoldIds().size).toBe(2);

      store.enterEditHoldsMode();
      expect(store.selectedHoldIds().size).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOLD SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  describe('hold selection', () => {
    it('should select a single hold', () => {
      store.selectHold(1);
      expect(store.selectedHoldIds().has(1)).toBeTrue();
      expect(store.selectedHoldIds().size).toBe(1);
    });

    it('should replace selection by default (single select)', () => {
      store.selectHold(1);
      store.selectHold(2);
      expect(store.selectedHoldIds().has(1)).toBeFalse();
      expect(store.selectedHoldIds().has(2)).toBeTrue();
      expect(store.selectedHoldIds().size).toBe(1);
    });

    it('should add to selection with multi-select flag', () => {
      store.selectHold(1);
      store.selectHold(2, true);
      expect(store.selectedHoldIds().has(1)).toBeTrue();
      expect(store.selectedHoldIds().has(2)).toBeTrue();
      expect(store.selectedHoldIds().size).toBe(2);
    });

    it('should remove from selection if already selected with multi-select', () => {
      store.selectHold(1);
      store.selectHold(2, true);
      store.selectHold(1, true); // Toggle off
      expect(store.selectedHoldIds().has(1)).toBeFalse();
      expect(store.selectedHoldIds().has(2)).toBeTrue();
    });

    it('should clear all selections', () => {
      store.selectHold(1);
      store.selectHold(2, true);
      store.clearSelection();
      expect(store.selectedHoldIds().size).toBe(0);
    });

    it('should track hovered hold separately from selection', () => {
      store.selectHold(1);
      store.setHoveredHold(2);
      expect(store.selectedHoldIds().has(1)).toBeTrue();
      expect(store.hoveredHoldId()).toBe(2);

      store.setHoveredHold(null);
      expect(store.hoveredHoldId()).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE IN PROGRESS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('route in progress', () => {
    it('should initialize empty route when entering createRoute mode', () => {
      store.enterCreateRouteMode();
      const rip = store.routeInProgress();
      expect(rip).toBeTruthy();
      expect(rip?.name).toBe('');
      expect(rip?.holds.length).toBe(0);
    });

    it('should load existing route when entering editRoute mode', () => {
      store.enterEditRouteMode(mockRoute);
      const rip = store.routeInProgress();
      expect(rip).toBeTruthy();
      expect(rip?.baseRouteId).toBe(10);
      expect(rip?.name).toBe('Test Route');
      expect(rip?.holds.length).toBe(2);
      expect(rip?.forwardGrade).toBe(5);
    });

    it('should add hold to route in progress', () => {
      store.enterCreateRouteMode();
      store.addHoldToRoute(mockHold1);
      expect(store.routeInProgress()?.holds.length).toBe(1);
      expect(store.routeInProgress()?.holds[0].holdId).toBe(1);
    });

    it('should not add duplicate hold to route', () => {
      store.enterCreateRouteMode();
      store.addHoldToRoute(mockHold1);
      store.addHoldToRoute(mockHold1);
      expect(store.routeInProgress()?.holds.length).toBe(1);
    });

    it('should remove hold from route in progress', () => {
      store.enterCreateRouteMode();
      store.addHoldToRoute(mockHold1);
      store.addHoldToRoute(mockHold2);
      store.removeHoldFromRoute(1);
      expect(store.routeInProgress()?.holds.length).toBe(1);
      expect(store.routeInProgress()?.holds[0].holdId).toBe(2);
    });

    it('should cycle forward start flags on hold', () => {
      store.enterCreateRouteMode();
      store.addHoldToRoute(mockHold1);

      // Initial state: no flags
      let hold = store.routeInProgress()?.holds[0];
      expect(hold?.forwardHandStart).toBeFalse();
      expect(hold?.forwardFootStart).toBeFalse();

      // First cycle: handstart
      store.cycleForwardStartFlag(1);
      hold = store.routeInProgress()?.holds[0];
      expect(hold?.forwardHandStart).toBeTrue();
      expect(hold?.forwardFootStart).toBeFalse();

      // Second cycle: footstart
      store.cycleForwardStartFlag(1);
      hold = store.routeInProgress()?.holds[0];
      expect(hold?.forwardHandStart).toBeFalse();
      expect(hold?.forwardFootStart).toBeTrue();

      // Third cycle: back to none
      store.cycleForwardStartFlag(1);
      hold = store.routeInProgress()?.holds[0];
      expect(hold?.forwardHandStart).toBeFalse();
      expect(hold?.forwardFootStart).toBeFalse();
    });

    it('should cycle reverse start flags on hold', () => {
      store.enterCreateRouteMode();
      store.addHoldToRoute(mockHold1);

      store.cycleReverseStartFlag(1);
      let hold = store.routeInProgress()?.holds[0];
      expect(hold?.reverseHandStart).toBeTrue();

      store.cycleReverseStartFlag(1);
      hold = store.routeInProgress()?.holds[0];
      expect(hold?.reverseFootStart).toBeTrue();
      expect(hold?.reverseHandStart).toBeFalse();
    });

    it('should update route metadata (name, grade, etc)', () => {
      store.enterCreateRouteMode();
      store.updateRouteMetadata({ name: 'New Name', forwardGrade: 6 });

      const rip = store.routeInProgress();
      expect(rip?.name).toBe('New Name');
      expect(rip?.forwardGrade).toBe(6);
    });

    it('should track isDirty when changes are made', () => {
      store.enterCreateRouteMode();
      expect(store.isDirty()).toBeFalse();

      store.addHoldToRoute(mockHold1);
      expect(store.isDirty()).toBeTrue();
    });

    it('should clear route in progress when exiting mode', () => {
      store.enterCreateRouteMode();
      store.addHoldToRoute(mockHold1);
      store.exitEditMode();

      expect(store.routeInProgress()).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe('computed properties', () => {
    it('should compute isDirty based on unsaved changes', () => {
      expect(store.isDirty()).toBeFalse();

      store.enterCreateRouteMode();
      expect(store.isDirty()).toBeFalse();

      store.updateRouteMetadata({ name: 'Changed' });
      expect(store.isDirty()).toBeTrue();
    });

    it('should compute selectedHoldCount', () => {
      expect(store.selectedHoldCount()).toBe(0);

      store.selectHold(1);
      expect(store.selectedHoldCount()).toBe(1);

      store.selectHold(2, true);
      expect(store.selectedHoldCount()).toBe(2);
    });

    it('should compute canSave based on valid state', () => {
      // In view mode, can't save
      expect(store.canSave()).toBeFalse();

      // In createRoute with no holds, can't save
      store.enterCreateRouteMode();
      expect(store.canSave()).toBeFalse();

      // With holds, can save
      store.addHoldToRoute(mockHold1);
      expect(store.canSave()).toBeTrue();
    });

    it('should compute isHoldInRoute', () => {
      store.enterCreateRouteMode();
      store.addHoldToRoute(mockHold1);

      expect(store.isHoldInRoute(1)).toBeTrue();
      expect(store.isHoldInRoute(2)).toBeFalse();
    });
  });
});

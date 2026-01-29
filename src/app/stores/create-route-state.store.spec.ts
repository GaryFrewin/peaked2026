import { TestBed } from '@angular/core/testing';
import { CreateRouteStateStore } from './create-route-state.store';

describe('CreateRouteStateStore', () => {
  let store: CreateRouteStateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CreateRouteStateStore);
  });

  describe('initial state', () => {
    it('should start with null draft route', () => {
      expect(store.draftRoute()).toBeNull();
    });
  });

  describe('addHold', () => {
    it('should create draft route when adding first hold', () => {
      store.addHold(42);

      const draft = store.draftRoute();
      expect(draft).not.toBeNull();
      expect(draft?.route_holds.length).toBe(1);
      expect(draft?.route_holds[0].hold_id).toBe(42);
    });

    it('should add additional holds to existing draft', () => {
      store.addHold(1);
      store.addHold(2);
      store.addHold(3);

      const draft = store.draftRoute();
      expect(draft?.route_holds.length).toBe(3);
      expect(draft?.route_holds.map(rh => rh.hold_id)).toEqual([1, 2, 3]);
    });

    it('should not add duplicate holds', () => {
      store.addHold(10);
      store.addHold(10);

      const draft = store.draftRoute();
      expect(draft?.route_holds.length).toBe(1);
    });
  });

  describe('removeHold', () => {
    it('should remove hold from draft route', () => {
      store.addHold(1);
      store.addHold(2);
      store.addHold(3);

      store.removeHold(2);

      const draft = store.draftRoute();
      expect(draft?.route_holds.length).toBe(2);
      expect(draft?.route_holds.map(rh => rh.hold_id)).toEqual([1, 3]);
    });

    it('should do nothing if hold not in route', () => {
      store.addHold(1);
      store.addHold(2);

      store.removeHold(99);

      const draft = store.draftRoute();
      expect(draft?.route_holds.length).toBe(2);
    });
  });

  describe('cycleHoldFlags', () => {
    it('should cycle through flag states: none → forwardhandstart', () => {
      store.addHold(1);

      store.cycleHoldFlags(1);

      const rh = store.draftRoute()?.route_holds[0];
      expect(rh?.forwardhandstart).toBe(true);
      expect(rh?.forwardfootstart).toBe(false);
      expect(rh?.reversehandstart).toBe(false);
      expect(rh?.reversefootstart).toBe(false);
    });

    it('should cycle: forwardhandstart → forwardfootstart', () => {
      store.addHold(1);
      store.cycleHoldFlags(1); // → forwardhandstart

      store.cycleHoldFlags(1); // → forwardfootstart

      const rh = store.draftRoute()?.route_holds[0];
      expect(rh?.forwardhandstart).toBe(false);
      expect(rh?.forwardfootstart).toBe(true);
    });

    it('should cycle: forwardfootstart → reversehandstart', () => {
      store.addHold(1);
      store.cycleHoldFlags(1); // → forwardhandstart
      store.cycleHoldFlags(1); // → forwardfootstart

      store.cycleHoldFlags(1); // → reversehandstart

      const rh = store.draftRoute()?.route_holds[0];
      expect(rh?.forwardfootstart).toBe(false);
      expect(rh?.reversehandstart).toBe(true);
    });

    it('should cycle: reversehandstart → reversefootstart', () => {
      store.addHold(1);
      store.cycleHoldFlags(1); // → forwardhandstart
      store.cycleHoldFlags(1); // → forwardfootstart
      store.cycleHoldFlags(1); // → reversehandstart

      store.cycleHoldFlags(1); // → reversefootstart

      const rh = store.draftRoute()?.route_holds[0];
      expect(rh?.reversehandstart).toBe(false);
      expect(rh?.reversefootstart).toBe(true);
    });

    it('should cycle: reversefootstart → none (back to start)', () => {
      store.addHold(1);
      store.cycleHoldFlags(1); // → forwardhandstart
      store.cycleHoldFlags(1); // → forwardfootstart
      store.cycleHoldFlags(1); // → reversehandstart
      store.cycleHoldFlags(1); // → reversefootstart

      store.cycleHoldFlags(1); // → none

      const rh = store.draftRoute()?.route_holds[0];
      expect(rh?.forwardhandstart).toBe(false);
      expect(rh?.forwardfootstart).toBe(false);
      expect(rh?.reversehandstart).toBe(false);
      expect(rh?.reversefootstart).toBe(false);
    });

    it('should add hold if not present before cycling', () => {
      store.cycleHoldFlags(5);

      const draft = store.draftRoute();
      expect(draft?.route_holds.length).toBe(1);
      expect(draft?.route_holds[0].hold_id).toBe(5);
      expect(draft?.route_holds[0].forwardhandstart).toBe(true);
    });
  });

  describe('clear', () => {
    it('should reset draft route to null', () => {
      store.addHold(1);
      store.addHold(2);
      store.cycleHoldFlags(1);

      store.clear();

      expect(store.draftRoute()).toBeNull();
    });
  });
});

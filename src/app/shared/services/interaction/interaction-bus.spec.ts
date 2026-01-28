/**
 * InteractionBus - Tests
 */

import { TestBed } from '@angular/core/testing';
import { InteractionBus, Point3D } from './interaction-bus';

describe('InteractionBus', () => {
  let bus: InteractionBus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InteractionBus],
    });
    bus = TestBed.inject(InteractionBus);
  });

  describe('single responsibility', () => {
    it('should be a bridge between A-Frame and Angular - nothing more', () => {
      // InteractionBus should NOT:
      // - Know about editor modes
      // - Make decisions about what events mean
      // - Call stores or APIs directly
      // 
      // It ONLY:
      // - Receives raw events from A-Frame land
      // - Exposes observables for Angular to subscribe to
      expect(bus).toBeTruthy();
    });
  });

  describe('hold events', () => {
    it('should emit holdClicked when emitHoldClicked is called', (done) => {
      bus.holdClicked$.subscribe((holdId) => {
        expect(holdId).toBe(42);
        done();
      });

      bus.emitHoldClicked(42);
    });

    it('should emit holdDoubleClicked when emitHoldDoubleClicked is called', (done) => {
      bus.holdDoubleClicked$.subscribe((holdId) => {
        expect(holdId).toBe(42);
        done();
      });

      bus.emitHoldDoubleClicked(42);
    });

    it('should emit holdHovered when emitHoldHovered is called', (done) => {
      bus.holdHovered$.subscribe((holdId) => {
        expect(holdId).toBe(99);
        done();
      });

      bus.emitHoldHovered(99);
    });

    it('should emit holdUnhovered when emitHoldUnhovered is called', (done) => {
      bus.holdUnhovered$.subscribe((holdId) => {
        expect(holdId).toBe(77);
        done();
      });

      bus.emitHoldUnhovered(77);
    });
  });

  describe('wall events', () => {
    it('should emit wallClicked with point when emitWallClicked is called', (done) => {
      const point: Point3D = { x: 0.5, y: 1.2, z: 0.1 };

      bus.wallClicked$.subscribe((emittedPoint) => {
        expect(emittedPoint).toEqual(point);
        done();
      });

      bus.emitWallClicked(point);
    });
  });

  describe('window bridge', () => {
    it('should expose itself on window.peakedBus for A-Frame access', () => {
      // The bus registers itself globally so A-Frame components can call it
      expect((window as any).peakedBus).toBe(bus);
    });
  });

  describe('multiple subscribers', () => {
    it('should notify all subscribers of holdClicked', () => {
      const received1: number[] = [];
      const received2: number[] = [];

      bus.holdClicked$.subscribe((id) => received1.push(id));
      bus.holdClicked$.subscribe((id) => received2.push(id));

      bus.emitHoldClicked(10);
      bus.emitHoldClicked(20);

      expect(received1).toEqual([10, 20]);
      expect(received2).toEqual([10, 20]);
    });
  });
});

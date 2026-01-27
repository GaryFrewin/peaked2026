/**
 * CalibrationStore Tests
 *
 * Tests for the calibration state machine that manages
 * the 5-step wall calibration wizard.
 */

import { TestBed } from '@angular/core/testing';
import { CalibrationStore, CalibrationPhase } from './calibration.store';

describe('CalibrationStore', () => {
  let store: CalibrationStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalibrationStore],
    });
    store = TestBed.inject(CalibrationStore);
  });

  describe('initial state', () => {
    it('should start in welcome phase', () => {
      expect(store.currentPhase()).toBe('welcome');
    });

    it('should have passthrough disabled initially', () => {
      expect(store.passthroughEnabled()).toBe(false);
    });

    it('should not be able to proceed initially', () => {
      expect(store.canProceed()).toBe(false);
    });
  });

  describe('phase transitions', () => {
    beforeEach(() => {
      // Enable proceeding for transition tests
      store.setCanProceed(true);
    });

    it('should transition from welcome to step1 on nextPhase', () => {
      expect(store.currentPhase()).toBe('welcome');
      store.nextPhase();
      expect(store.currentPhase()).toBe('step1');
    });

    it('should transition from step1 to step2 on nextPhase', () => {
      store.nextPhase(); // welcome -> step1
      store.setCanProceed(true);
      store.nextPhase(); // step1 -> step2
      expect(store.currentPhase()).toBe('step2');
    });

    it('should transition from step2 to step3 on nextPhase', () => {
      store.nextPhase(); // welcome -> step1
      store.setCanProceed(true);
      store.nextPhase(); // step1 -> step2
      store.setCanProceed(true);
      store.nextPhase(); // step2 -> step3
      expect(store.currentPhase()).toBe('step3');
    });

    it('should transition from step3 to step4 on nextPhase', () => {
      store.nextPhase(); // welcome -> step1
      store.setCanProceed(true);
      store.nextPhase(); // step1 -> step2
      store.setCanProceed(true);
      store.nextPhase(); // step2 -> step3
      store.setCanProceed(true);
      store.nextPhase(); // step3 -> step4
      expect(store.currentPhase()).toBe('step4');
    });

    it('should transition from step4 to complete on nextPhase', () => {
      store.nextPhase(); // welcome -> step1
      store.setCanProceed(true);
      store.nextPhase(); // step1 -> step2
      store.setCanProceed(true);
      store.nextPhase(); // step2 -> step3
      store.setCanProceed(true);
      store.nextPhase(); // step3 -> step4
      store.setCanProceed(true);
      store.nextPhase(); // step4 -> complete
      expect(store.currentPhase()).toBe('complete');
    });

    it('should not transition past complete', () => {
      // Go all the way to complete
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      expect(store.currentPhase()).toBe('complete');

      // Try to go further
      store.setCanProceed(true);
      store.nextPhase();
      expect(store.currentPhase()).toBe('complete');
    });
  });

  describe('passthrough state', () => {
    beforeEach(() => {
      store.setCanProceed(true);
    });

    it('should have passthrough OFF in welcome', () => {
      expect(store.currentPhase()).toBe('welcome');
      expect(store.passthroughEnabled()).toBe(false);
    });

    it('should have passthrough ON in step1', () => {
      store.nextPhase(); // -> step1
      expect(store.passthroughEnabled()).toBe(true);
    });

    it('should have passthrough OFF in step2', () => {
      store.nextPhase(); // -> step1
      store.setCanProceed(true);
      store.nextPhase(); // -> step2
      expect(store.passthroughEnabled()).toBe(false);
    });

    it('should have passthrough ON in step3', () => {
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase(); // -> step3
      expect(store.passthroughEnabled()).toBe(true);
    });

    it('should have passthrough ON in step4', () => {
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase(); // -> step4
      expect(store.passthroughEnabled()).toBe(true);
    });

    it('should have passthrough ON in complete', () => {
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase(); // -> complete
      expect(store.passthroughEnabled()).toBe(true);
    });
  });

  describe('canProceed', () => {
    it('should block nextPhase when canProceed is false', () => {
      expect(store.canProceed()).toBe(false);
      store.nextPhase();
      expect(store.currentPhase()).toBe('welcome'); // Still welcome
    });

    it('should allow nextPhase when canProceed is true', () => {
      store.setCanProceed(true);
      store.nextPhase();
      expect(store.currentPhase()).toBe('step1');
    });

    it('should reset canProceed to false after transition', () => {
      store.setCanProceed(true);
      expect(store.canProceed()).toBe(true);
      store.nextPhase();
      expect(store.canProceed()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to welcome phase', () => {
      store.setCanProceed(true);
      store.nextPhase();
      store.setCanProceed(true);
      store.nextPhase();
      expect(store.currentPhase()).toBe('step2');

      store.reset();
      expect(store.currentPhase()).toBe('welcome');
    });

    it('should reset canProceed to false', () => {
      store.setCanProceed(true);
      store.reset();
      expect(store.canProceed()).toBe(false);
    });
  });
});

/**
 * CalibrationStore
 *
 * Signal-based state machine for the wall calibration wizard.
 * Manages phase transitions and passthrough mode state.
 */
import { Injectable, computed, signal } from '@angular/core';

/** All possible calibration phases */
export type CalibrationPhase =
  | 'welcome'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'complete';

/** Phase order for transitions */
const PHASE_ORDER: CalibrationPhase[] = [
  'welcome',
  'step1',
  'step2',
  'step3',
  'step4',
  'complete',
];

/** Phases where passthrough (AR) mode is enabled */
const PASSTHROUGH_PHASES: Set<CalibrationPhase> = new Set([
  'step1', // Place real markers - need to see physical wall
  'step3', // Alignment - need to see physical wall
  'step4', // Fine-tune - need to see physical wall
  'complete', // Done - stay in passthrough
]);

@Injectable({ providedIn: 'root' })
export class CalibrationStore {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current phase of the calibration wizard */
  readonly currentPhase = signal<CalibrationPhase>('welcome');

  /** Whether the user can proceed to the next phase */
  readonly canProceed = signal<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  /** Whether passthrough (AR) mode should be enabled */
  readonly passthroughEnabled = computed(() =>
    PASSTHROUGH_PHASES.has(this.currentPhase())
  );

  /** Current phase index (0-5) */
  readonly currentPhaseIndex = computed(() =>
    PHASE_ORDER.indexOf(this.currentPhase())
  );

  /** Whether we're at the final phase */
  readonly isComplete = computed(() => this.currentPhase() === 'complete');

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Advance to the next phase if canProceed is true.
   * Resets canProceed to false after transition.
   */
  nextPhase(): void {
    if (!this.canProceed()) {
      console.log('[CalibrationStore] Cannot proceed - canProceed is false');
      return;
    }

    const currentIndex = this.currentPhaseIndex();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= PHASE_ORDER.length) {
      console.log('[CalibrationStore] Already at final phase');
      return;
    }

    const nextPhase = PHASE_ORDER[nextIndex];
    console.log(
      `[CalibrationStore] Transitioning: ${this.currentPhase()} -> ${nextPhase}`
    );

    this.currentPhase.set(nextPhase);
    this.canProceed.set(false);
  }

  /**
   * Set whether the user can proceed to the next phase.
   * Components call this when their criteria are met (e.g., markers placed).
   */
  setCanProceed(value: boolean): void {
    this.canProceed.set(value);
  }

  /**
   * Reset the store to initial state.
   */
  reset(): void {
    console.log('[CalibrationStore] Resetting to initial state');
    this.currentPhase.set('welcome');
    this.canProceed.set(false);
  }
}

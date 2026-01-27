/**
 * VrCalibrationPageComponent
 *
 * VR page for guiding users through wall calibration in AR mode.
 * Uses CalibrationStore for state management.
 *
 * @ported-from peaked/src/app/pages/playground/playground-calibrate/
 */
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
} from '@angular/core';

import { CalibrationStore } from '../../../stores/calibration.store';

// Register vr-button A-Frame component
import { registerVrButtonComponent } from '../../behaviours/vr-button';

// Register on module load
registerVrButtonComponent();

@Component({
  selector: 'app-vr-calibration-page',
  templateUrl: './vr-calibration-page.html',
  styleUrl: './vr-calibration-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VrCalibrationPageComponent {
  private readonly store = inject(CalibrationStore);

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE STATE (exposed for template)
  // ═══════════════════════════════════════════════════════════════════════════

  readonly currentPhase = this.store.currentPhase;
  readonly passthroughEnabled = this.store.passthroughEnabled;
  readonly canProceed = this.store.canProceed;

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED (panel visibility)
  // ═══════════════════════════════════════════════════════════════════════════

  readonly showWelcomePanel = computed(() => this.currentPhase() === 'welcome');
  readonly showStep1Panel = computed(() => this.currentPhase() === 'step1');
  readonly showStep2Panel = computed(() => this.currentPhase() === 'step2');
  readonly showStep3Panel = computed(() => this.currentPhase() === 'step3');
  readonly showStep4Panel = computed(() => this.currentPhase() === 'step4');
  readonly showCompletePanel = computed(() => this.currentPhase() === 'complete');

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Called when BEGIN button is clicked - start the wizard
   */
  onBeginClick(): void {
    console.log('[VrCalibrationPage] BEGIN clicked');
    this.store.setCanProceed(true);
    this.store.nextPhase();
  }

  /**
   * Called when NEXT button is clicked on any step
   */
  onNextClick(): void {
    console.log('[VrCalibrationPage] NEXT clicked');
    this.store.setCanProceed(true);
    this.store.nextPhase();
  }
}

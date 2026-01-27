/**
 * VrCalibrationPageComponent
 *
 * VR page for guiding users through wall calibration in AR mode.
 * Phase 1: Shows welcome panel with BEGIN button.
 *
 * @ported-from peaked/src/app/pages/playground/playground-calibrate/
 */
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';

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
  /**
   * Called when the BEGIN button is clicked in VR
   */
  onBeginClick(): void {
    console.log('[VrCalibrationPage] BEGIN clicked');
    // TODO: Phase 2 - transition to step 1 of calibration wizard
  }
}

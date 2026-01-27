/**
 * VrCalibrationPageComponent
 *
 * VR page for guiding users through wall calibration in AR mode.
 * Uses CalibrationStore for state management.
 *
 * @ported-from peaked/src/app/pages/playground/playground-calibrate/
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { CalibrationStore } from '../../../stores/calibration.store';
import { WallStore } from '../../../stores/wall.store';

// Register A-Frame components
import { registerVrButtonComponent } from '../../behaviours/vr-button';
import { registerMarkerPlacerComponent } from '../../behaviours/marker-placer';
import { registerWallManipulatorComponent } from '../../behaviours/wall-manipulator';

// Register on module load
registerVrButtonComponent();
registerMarkerPlacerComponent();
registerWallManipulatorComponent();

@Component({
  selector: 'app-vr-calibration-page',
  templateUrl: './vr-calibration-page.html',
  styleUrl: './vr-calibration-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VrCalibrationPageComponent implements OnInit, AfterViewInit {
  private readonly store = inject(CalibrationStore);
  private readonly wallStore = inject(WallStore);
  private readonly router = inject(Router);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL STATE
  // ═══════════════════════════════════════════════════════════════════════════

  readonly markersPlaced = signal(0);
  private readonly sceneReady = signal(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // WALL STORE STATE (exposed for template)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Model path for the GLTF wall model */
  readonly modelPath = this.wallStore.modelPath;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR - Wall auto-selection effect
  // ═══════════════════════════════════════════════════════════════════════════

  constructor() {
    // Effect to auto-select first wall when walls load
    effect(() => {
      const walls = this.wallStore.walls();
      const alreadySelected = this.wallStore.selectedWall();

      // Only auto-select when: walls loaded, nothing selected yet
      if (walls.length > 0 && !alreadySelected) {
        console.log('[VrCalibrationPage] Auto-selecting first wall:', walls[0].name);
        this.wallStore.selectWall(walls[0].id);

        if (walls[0].wall_versions.length > 0) {
          // Select the latest version (last in array)
          const versions = walls[0].wall_versions;
          const version = versions[versions.length - 1];
          console.log('[VrCalibrationPage] Auto-selecting latest version:', version.id, 'model_path:', version.model_path);
          this.wallStore.selectVersion(version.id);
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE STATE (exposed for template)
  // ═══════════════════════════════════════════════════════════════════════════

  readonly currentPhase = this.store.currentPhase;
  readonly passthroughEnabled = this.store.passthroughEnabled;
  readonly canProceed = this.store.canProceed;

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE STATE
  // ═══════════════════════════════════════════════════════════════════════════

  private rightController: HTMLElement | null = null;

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
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    // Load walls if not already loaded
    if (this.wallStore.walls().length === 0) {
      console.log('[VrCalibrationPage] Loading walls...');
      this.wallStore.loadWalls();
    }
  }

  ngAfterViewInit(): void {
    // Wait for scene to load, then set up event listeners
    const scene = document.querySelector('a-scene');
    if (scene) {
      if ((scene as any).hasLoaded) {
        this.setupAfterSceneLoad();
      } else {
        scene.addEventListener('loaded', () => this.setupAfterSceneLoad(), {
          once: true,
        });
      }
    }
  }

  private setupAfterSceneLoad(): void {
    console.log('[VrCalibrationPage] Scene loaded, setting up listeners');

    // Get controller reference
    this.rightController = document.getElementById('rightController');

    // Listen for marker-placed events
    if (this.rightController) {
      this.rightController.addEventListener('marker-placed', ((
        event: CustomEvent
      ) => {
        this.onMarkerPlaced(event);
      }) as EventListener);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKER EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  private onMarkerPlaced(event: CustomEvent): void {
    const { count } = event.detail;
    console.log(`[VrCalibrationPage] Marker placed: ${count}/3`);
    this.markersPlaced.set(count);

    // Enable NEXT button when all 3 markers placed
    if (count >= 3) {
      console.log('[VrCalibrationPage] All markers placed - enabling NEXT');
      this.store.setCanProceed(true);
    }
  }

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

    // Enable marker-placer on step1
    if (this.rightController) {
      this.rightController.setAttribute('marker-placer', 'enabled: true');
    }
  }

  /**
   * Called when NEXT button is clicked on any step
   */
  onNextClick(): void {
    console.log('[VrCalibrationPage] NEXT clicked');

    // Disable marker-placer when leaving step1
    if (this.currentPhase() === 'step1' && this.rightController) {
      this.rightController.setAttribute('marker-placer', 'enabled: false');
    }

    this.store.setCanProceed(true);
    this.store.nextPhase();
  }

  /**
   * Navigate back to home page after calibration complete
   */
  goHome(): void {
    console.log('[VrCalibrationPage] Navigating home');
    this.store.reset();
    this.router.navigate(['/']);
  }
}

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
import { registerSurfaceCursorComponent } from '../../behaviours/surface-cursor';
import { registerTriangleAlignComponent } from '../../behaviours/triangle-align';
import { registerWireframeRevealBehaviour } from '../../behaviours/wireframe-reveal/wireframe-reveal';

// Register on module load
registerVrButtonComponent();
registerMarkerPlacerComponent();
registerWallManipulatorComponent();
registerSurfaceCursorComponent();
registerTriangleAlignComponent();
registerWireframeRevealBehaviour();

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
  readonly modelMarkersPlaced = signal(0);
  private readonly sceneReady = signal(false);

  /**
   * Real marker world positions (Step 1).
   * These are the VR-tracked positions where the user placed markers on the real wall.
   */
  private readonly realMarkerPositions: Array<{ x: number; y: number; z: number }> = [];

  /**
   * Model marker local positions (Step 2).
   * These are local-space positions on the GLTF model where the user placed markers.
   */
  private readonly modelMarkerPositions: Array<{ x: number; y: number; z: number }> = [];

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
  private wallContainer: HTMLElement | null = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED (panel visibility)
  // ═══════════════════════════════════════════════════════════════════════════

  readonly showWelcomePanel = computed(() => this.currentPhase() === 'welcome');
  readonly showStep1Panel = computed(() => this.currentPhase() === 'step1');
  readonly showStep2Panel = computed(() => this.currentPhase() === 'step2');
  readonly showStep3Panel = computed(() => this.currentPhase() === 'step3');
  
  /** Model should only be intersectable in step2 (placing model markers) */
  readonly modelIntersectable = computed(() => this.currentPhase() === 'step2');
  readonly showStep4Panel = computed(() => this.currentPhase() === 'step4');
  readonly showCompletePanel = computed(() => this.currentPhase() === 'complete');
  
  /** Wall model should be visible in steps 2, 3, and 4 */
  readonly showWallModel = computed(() => {
    const phase = this.currentPhase();
    return phase === 'step2' || phase === 'step3' || phase === 'step4';
  });

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
    
    // Get wall-container reference for alignment
    this.wallContainer = document.getElementById('wall-container');

    // Listen for marker-placed events (Step 1 - real markers)
    if (this.rightController) {
      this.rightController.addEventListener('marker-placed', ((event: CustomEvent) => {
        this.onMarkerPlaced(event);
      }) as EventListener);

      // Listen for surface-point-selected events (Step 2 - model markers)
      this.rightController.addEventListener('surface-point-selected', ((event: CustomEvent) => {
        this.onSurfacePointSelected(event);
      }) as EventListener);
      
      // Listen for markers-updated events (Step 4 - fine-tune drag)
      this.rightController.addEventListener('markers-updated', ((event: CustomEvent) => {
        this.onMarkersUpdated(event);
      }) as EventListener);
    }
    
    // Listen for alignment-complete event (Step 3)
    if (this.wallContainer) {
      this.wallContainer.addEventListener('alignment-complete', ((event: CustomEvent) => {
        this.onAlignmentComplete(event);
      }) as EventListener);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKER EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  private onMarkerPlaced(event: CustomEvent): void {
    const { count, position } = event.detail;
    console.log(`[VrCalibrationPage] Marker placed: ${count}/3 at`, position);
    
    // Store the real marker world position
    if (position) {
      // Make sure we replace or add at the correct index
      this.realMarkerPositions[count - 1] = {
        x: position.x,
        y: position.y,
        z: position.z,
      };
      console.log('[VrCalibrationPage] Stored real marker positions:', this.realMarkerPositions);
    }
    
    this.markersPlaced.set(count);

    // Enable NEXT button when all 3 markers placed
    if (count >= 3) {
      console.log('[VrCalibrationPage] All markers placed - enabling NEXT');
      this.store.setCanProceed(true);
    }
  }

  /**
   * Called when surface-cursor emits a point on the 3D model (Step 2)
   */
  private onSurfacePointSelected(event: CustomEvent): void {
    // Only handle in Step 2
    if (this.currentPhase() !== 'step2') return;

    const currentCount = this.modelMarkersPlaced();
    if (currentCount >= 3) {
      console.log('[VrCalibrationPage] Already placed 3 model markers');
      return;
    }

    const { point } = event.detail;
    const markerIndex = currentCount + 1;
    console.log(`[VrCalibrationPage] Model marker ${markerIndex} world point:`, point);

    // Show and position the marker
    const marker = document.getElementById(`model-marker-${markerIndex}`) as any;
    if (marker) {
      // Markers are children of wall-container, so convert world point to local space
      const wallContainer = document.getElementById('wall-container') as any;
      if (wallContainer && wallContainer.object3D) {
        // Create a THREE.Vector3 from the point
        const worldPoint = new (window as any).THREE.Vector3(point.x, point.y, point.z);
        const localPoint = wallContainer.object3D.worldToLocal(worldPoint);
        console.log(`[VrCalibrationPage] Converted to local:`, localPoint);
        
        marker.object3D.position.copy(localPoint);
        
        // Store the local position for alignment
        this.modelMarkerPositions[markerIndex - 1] = {
          x: localPoint.x,
          y: localPoint.y,
          z: localPoint.z,
        };
        console.log('[VrCalibrationPage] Stored model marker positions:', this.modelMarkerPositions);
      } else {
        // Fallback - use world coords (may be wrong if wall-container moved)
        marker.setAttribute('position', `${point.x} ${point.y} ${point.z}`);
        
        // Store world coords as fallback
        this.modelMarkerPositions[markerIndex - 1] = {
          x: point.x,
          y: point.y,
          z: point.z,
        };
      }
      
      marker.setAttribute('visible', 'true');
    }

    this.modelMarkersPlaced.set(markerIndex);

    // Enable NEXT when all 3 placed
    if (markerIndex >= 3) {
      console.log('[VrCalibrationPage] All model markers placed - enabling NEXT');
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
    console.log('[VrCalibrationPage] NEXT clicked, current phase:', this.currentPhase());

    // Disable marker-placer when leaving step1
    if (this.currentPhase() === 'step1' && this.rightController) {
      this.rightController.setAttribute('marker-placer', 'enabled: false');
      // Enable surface-cursor for step2
      this.rightController.setAttribute('surface-cursor', 'enabled: true; cursorEl: #surface-cursor-visual; targetClass: intersectable');
      console.log('[VrCalibrationPage] Enabled surface-cursor for Step 2');
    }

    // Disable surface-cursor and trigger alignment when leaving step2
    if (this.currentPhase() === 'step2' && this.rightController) {
      this.rightController.setAttribute('surface-cursor', 'enabled: false');
      console.log('[VrCalibrationPage] Disabled surface-cursor');
      
      // Trigger alignment for Step 3
      this.triggerAlignment();
    }
    
    // Enable marker-placer for fine-tune dragging when entering step4
    if (this.currentPhase() === 'step3' && this.rightController) {
      this.rightController.setAttribute('marker-placer', 'enabled: true');
      console.log('[VrCalibrationPage] Re-enabled marker-placer for Step 4 fine-tune');
    }
    
    // Disable marker-placer when leaving step4
    if (this.currentPhase() === 'step4' && this.rightController) {
      this.rightController.setAttribute('marker-placer', 'enabled: false');
      console.log('[VrCalibrationPage] Disabled marker-placer on complete');
    }

    this.store.setCanProceed(true);
    this.store.nextPhase();
  }
  
  /**
   * Trigger the triangle alignment algorithm.
   * Gets current world positions of markers and calls align().
   */
  private triggerAlignment(): void {
    // Re-fetch wall-container in case it wasn't available at scene load
    if (!this.wallContainer) {
      this.wallContainer = document.getElementById('wall-container');
    }
    
    if (!this.wallContainer) {
      console.error('[VrCalibrationPage] No wall-container found');
      return;
    }
    
    // Get the triangle-align component
    const triangleAlign = (this.wallContainer as any).components?.['triangle-align'];
    if (!triangleAlign) {
      console.error('[VrCalibrationPage] triangle-align component not found on wall-container');
      return;
    }
    
    // Validate we have 3 real markers stored
    if (this.realMarkerPositions.length !== 3) {
      console.error('[VrCalibrationPage] Need exactly 3 real markers, have:', this.realMarkerPositions.length);
      return;
    }
    
    const THREE = (window as any).THREE;
    
    // Convert stored real marker positions to THREE.Vector3
    const realPositions = this.realMarkerPositions.map(
      p => new THREE.Vector3(p.x, p.y, p.z)
    );
    
    // Get CURRENT world positions of model markers (like old code does)
    // This ensures we get accurate positions even if wall-container was moved
    const modelPositions: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const marker = document.getElementById(`model-marker-${i}`) as any;
      if (marker && marker.object3D) {
        const worldPos = new THREE.Vector3();
        marker.object3D.getWorldPosition(worldPos);
        modelPositions.push(worldPos);
        console.log(`[VrCalibrationPage] Model marker ${i} world pos:`, worldPos.x.toFixed(4), worldPos.y.toFixed(4), worldPos.z.toFixed(4));
      } else {
        console.error(`[VrCalibrationPage] Model marker ${i} not found or has no object3D`);
        return;
      }
    }
    
    console.log('[VrCalibrationPage] Triggering alignment with:');
    console.log('  Real positions (world):', realPositions.map((p: any) => ({ x: p.x.toFixed(4), y: p.y.toFixed(4), z: p.z.toFixed(4) })));
    console.log('  Model positions (world):', modelPositions.map((p: any) => ({ x: p.x.toFixed(4), y: p.y.toFixed(4), z: p.z.toFixed(4) })));
    
    // Call align
    triangleAlign.align(realPositions, modelPositions);
  }
  
  /**
   * Called when triangle-align emits alignment-complete event
   */
  private onAlignmentComplete(event: CustomEvent): void {
    console.log('[VrCalibrationPage] Alignment complete:', event.detail);
    
    // Trigger wireframe reveal effect on the garage (wall model)
    const garage = document.getElementById('garage') as any;
    if (garage) {
      console.log('[VrCalibrationPage] Starting wireframe reveal effect');
      garage.setAttribute('wireframe-reveal', 'duration: 3000; color: #00ff88');
      
      // Listen for completion
      garage.addEventListener('wireframe-reveal-complete', () => {
        console.log('[VrCalibrationPage] Wireframe reveal complete');
        this.store.setCanProceed(true);
      }, { once: true });
    } else {
      // No garage found, just enable proceed
      this.store.setCanProceed(true);
    }
  }

  /**
   * Called when marker-placer emits markers-updated (Step 4 - fine-tune drag)
   * Re-runs alignment with new marker positions.
   */
  private onMarkersUpdated(event: CustomEvent): void {
    // Only process in step4 (fine-tune mode)
    if (this.currentPhase() !== 'step4') {
      return;
    }
    
    console.log('[VrCalibrationPage] Markers updated, re-aligning in real-time');
    
    const { positions } = event.detail;
    if (!positions || positions.length < 3) {
      console.warn('[VrCalibrationPage] Invalid positions in markers-updated event');
      return;
    }
    
    // Update stored real marker positions from the event
    for (let i = 0; i < 3; i++) {
      if (positions[i]) {
        this.realMarkerPositions[i] = {
          x: positions[i].x,
          y: positions[i].y,
          z: positions[i].z,
        };
      }
    }
    
    // Re-run alignment with updated positions
    this.runQuickAlignment();
  }
  
  /**
   * Quick alignment for fine-tune mode (no wireframe effect).
   * Uses stored model marker LOCAL positions transformed through current wall transform.
   */
  private runQuickAlignment(): void {
    if (!this.wallContainer) {
      this.wallContainer = document.getElementById('wall-container');
    }
    
    if (!this.wallContainer) {
      console.error('[VrCalibrationPage] No wall-container found for realignment');
      return;
    }
    
    const triangleAlign = (this.wallContainer as any).components?.['triangle-align'];
    if (!triangleAlign) {
      console.error('[VrCalibrationPage] triangle-align component not found');
      return;
    }
    
    const THREE = (window as any).THREE;
    
    // Real marker positions (new positions after drag)
    const realVectors = this.realMarkerPositions.map(
      p => new THREE.Vector3(p.x, p.y, p.z)
    );
    
    // Model marker positions - compute CURRENT world positions from stored LOCAL positions
    // The local positions are relative to wall-container, so we transform through current wall transform
    const modelVectors = this.modelMarkerPositions.map((p: any) => {
      const localPos = new THREE.Vector3(p.x, p.y, p.z);
      const worldPos = (this.wallContainer as any).object3D.localToWorld(localPos.clone());
      return worldPos;
    });
    
    console.log('[VrCalibrationPage] Quick realignment:');
    console.log('  Real positions:', realVectors.map((v: any) => `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`));
    console.log('  Model positions:', modelVectors.map((v: any) => `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`));
    
    // Run alignment (instant, no animation)
    triangleAlign.align(realVectors, modelVectors);
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

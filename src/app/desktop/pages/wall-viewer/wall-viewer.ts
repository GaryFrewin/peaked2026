import { ChangeDetectionStrategy, Component, effect, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { BaseSceneComponent } from '../../../shared/components/base-scene/base-scene';
import { WallStore } from '../../../stores/wall.store';
import { HoldStore } from '../../../stores/hold.store';
import { RouteStore } from '../../../stores/route.store';
import { RouteListComponent } from '../../components/route-list/route-list';
import { EditorToolbarComponent } from '../../../shared/components/editor-toolbar/editor-toolbar.component';
import { EditorStore } from '../../../stores/editor.store';
import { EditorService } from '../../../shared/editor/editor.service';

// Hold styling colors
const HOLD_COLORS = {
  DEFAULT: '#FFFFFF',
  HOVERED: '#FFFF00',  // Yellow highlight
  SELECTED: '#FF6B00', // Orange for selected
};

@Component({
  selector: 'app-wall-viewer',
  standalone: true,
  imports: [BaseSceneComponent, RouteListComponent, EditorToolbarComponent],
  templateUrl: './wall-viewer.html',
  styleUrl: './wall-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WallViewerComponent implements OnInit {
  @ViewChild(BaseSceneComponent) baseScene!: BaseSceneComponent;
  
  protected readonly wallStore = inject(WallStore);
  protected readonly holdStore = inject(HoldStore);
  protected readonly routeStore = inject(RouteStore);
  protected readonly editorStore = inject(EditorStore);
  protected readonly editorService = inject(EditorService);

  private readonly sceneReady = signal(false);
  
  /** Locally tracked hover state (desktop-specific) */
  protected readonly hoveredHoldId = signal<number | null>(null);
  
  /** Track previous tool to detect transitions */
  private previousToolId = '';

  constructor() {
    // Effect to auto-select first wall when walls load AND scene is ready
    effect(() => {
      const walls = this.wallStore.walls();
      const isSceneReady = this.sceneReady();
      const alreadySelected = this.wallStore.selectedWall();
      const modelPath = this.wallStore.modelPath();

      console.log('WallViewer effect:', {
        wallsCount: walls.length,
        isSceneReady,
        alreadySelected: !!alreadySelected,
        selectedWallName: alreadySelected?.name,
        modelPath
      });

      // Only auto-select when: walls loaded, scene ready, nothing selected yet
      if (walls.length > 0 && isSceneReady && !alreadySelected) {
        console.log('Auto-selecting first wall:', walls[0].name);
        this.wallStore.selectWall(walls[0].id);
        
        if (walls[0].wall_versions.length > 0) {
          // Select the latest version (last in array)
          const versions = walls[0].wall_versions;
          const version = versions[versions.length - 1];
          console.log('Auto-selecting latest version:', version.id, 'model_path:', version.model_path);
          this.wallStore.selectVersion(version.id);
          this.holdStore.loadHolds(String(walls[0].id), String(version.id));
          // Also load routes for this wall/version
          this.routeStore.loadRoutes(walls[0].id, version.id);
        }
      }
    });
    
    // Effect to trigger wave animation when entering/exiting edit mode
    effect(() => {
      const currentToolId = this.editorService.activeToolId();
      
      // Detect transition into edit mode
      if (currentToolId === 'editHolds' && this.previousToolId !== 'editHolds') {
        console.log('[WallViewer] Entering edit mode - triggering wave animation');
        // Small delay to ensure scene is ready
        setTimeout(() => this.baseScene?.triggerHoldWave(), 50);
      }
      
      // Detect transition out of edit mode  
      if (currentToolId !== 'editHolds' && this.previousToolId === 'editHolds') {
        console.log('[WallViewer] Exiting edit mode - stopping wave animation');
        this.baseScene?.stopHoldWave();
      }
      
      this.previousToolId = currentToolId;
    });
  }

  ngOnInit(): void {
    console.log('WallViewer ngOnInit - current walls:', this.wallStore.walls().length);
    
    // Load walls if not already loaded
    if (this.wallStore.walls().length === 0) {
      console.log('WallViewer: Loading walls...');
      this.wallStore.loadWalls();
    } else {
      console.log('WallViewer: Walls already loaded, count:', this.wallStore.walls().length);
      // If walls exist but none selected, we need to trigger selection
      // The effect will handle this when sceneReady becomes true
    }
  }

  onSceneReady(): void {
    console.log('Desktop scene ready - setting sceneReady signal');
    this.sceneReady.set(true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HOLD MATERIAL CALLBACK (provided to BaseScene)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns A-Frame material string for a hold based on editor state.
   * This is the desktop-specific styling logic - BaseScene doesn't care about modes.
   */
  protected readonly holdMaterialFn = (holdId: number): string => {
    const isSelected = this.editorStore.selectedHoldIds().has(holdId);
    const isHovered = this.hoveredHoldId() === holdId;
    
    // Selection takes priority
    if (isSelected) {
      return `color: ${HOLD_COLORS.SELECTED}; emissive: ${HOLD_COLORS.SELECTED}; emissiveIntensity: 0.5; opacity: 0.9`;
    }
    
    // Hover highlight (only in edit mode)
    if (isHovered && this.editorService.activeToolId() === 'editHolds') {
      return `color: ${HOLD_COLORS.HOVERED}; emissive: ${HOLD_COLORS.HOVERED}; emissiveIntensity: 0.3; opacity: 0.9`;
    }
    
    // Default
    return `color: ${HOLD_COLORS.DEFAULT}; opacity: 0.8`;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HOLD INTERACTION HANDLERS (from BaseScene events)
  // ═══════════════════════════════════════════════════════════════════════════

  onHoldHovered(holdId: number): void {
    this.hoveredHoldId.set(holdId);
    this.editorService.handleHoldHover(holdId);
  }

  onHoldHoverEnded(holdId: number): void {
    if (this.hoveredHoldId() === holdId) {
      this.hoveredHoldId.set(null);
    }
    this.editorService.handleHoldHoverEnd(holdId);
  }

  onHoldClicked(holdId: number): void {
    this.editorService.handleHoldClick(holdId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS (desktop-specific)
  // ═══════════════════════════════════════════════════════════════════════════

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Space or Enter to select hovered hold
    if ((event.code === 'Space' || event.code === 'Enter') && this.hoveredHoldId() !== null) {
      event.preventDefault();
      this.editorService.handleHoldClick(this.hoveredHoldId()!);
    }
    
    // Escape to switch to view mode
    if (event.code === 'Escape') {
      this.editorService.setTool('view');
    }
    
    // H for edit holds mode
    if (event.code === 'KeyH' && !event.ctrlKey && !event.altKey) {
      this.editorService.setTool('editHolds');
    }
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { ModeStore, AppMode } from '../../../stores/mode.store';
import { EditHoldStateStore } from '../../../stores/edit-hold-state.store';
import { InteractionHandler } from '../../../shared/services/interaction/interaction-handler';

/**
 * Tool item definition for the toolbar
 */
export interface ToolItem {
  id: string;
  mode?: AppMode; // If set, clicking this tool changes mode
  icon: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  dividerAfter?: boolean;
}

/**
 * EDITOR TOOLBAR
 *
 * A stylish vertical toolbar with fluid hover animations.
 * Positioned on the right edge of the screen.
 *
 * Features:
 * - Icons expand on hover to reveal labels
 * - Smooth staggered animations
 * - Glass-morphism design
 * - Keyboard shortcut hints
 */
@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorToolbarComponent implements OnInit {
  private readonly modeStore = inject(ModeStore);
  private readonly editHoldState = inject(EditHoldStateStore);
  private readonly interactionHandler = inject(InteractionHandler);

  /** Emitted when a tool is clicked */
  readonly toolSelected = output<string>();

  /** Currently hovered tool ID */
  readonly hoveredTool = signal<string | null>(null);

  /** Whether merge button should be shown (2+ holds selected in EditHolds mode) */
  readonly showMergeButton = computed(() => {
    return this.modeStore.isEditHoldsMode() && this.editHoldState.selectedHoldIds().size >= 2;
  });

  /** Count of selected holds for merge button label */
  readonly selectedHoldCount = computed(() => this.editHoldState.selectedHoldIds().size);

  /** Tool definitions */
  readonly tools: ToolItem[] = [
    {
      id: 'view',
      mode: AppMode.View,
      icon: '👁️',
      label: 'View Mode',
      shortcut: 'Esc',
    },
    {
      id: 'editHolds',
      mode: AppMode.EditHolds,
      icon: '📍',
      label: 'Edit Holds',
      shortcut: 'H',
      dividerAfter: true,
    },
    {
      id: 'createRoute',
      mode: AppMode.CreateRoute,
      icon: '➕',
      label: 'New Route',
      shortcut: 'N',
    },
    {
      id: 'editRoute',
      mode: AppMode.EditRoute,
      icon: '✏️',
      label: 'Edit Route',
      shortcut: 'E',
      dividerAfter: true,
    },
    {
      id: 'save',
      icon: '💾',
      label: 'Save',
      shortcut: 'Ctrl+S',
    },
    {
      id: 'undo',
      icon: '↩️',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings',
    },
  ];

  ngOnInit(): void {
  }

  onToolHover(toolId: string | null): void {
    this.hoveredTool.set(toolId);
  }

  onToolClick(tool: ToolItem): void {
    if (tool.disabled) return;

    // If tool has a mode, switch to it
    if (tool.mode !== undefined) {
      this.modeStore.setMode(tool.mode);
    }

    // Always emit the tool selection
    this.toolSelected.emit(tool.id);
  }

  isActive(toolId: string): boolean {
    const tool = this.tools.find(t => t.id === toolId);
    if (tool?.mode !== undefined) {
      return this.modeStore.mode() === tool.mode;
    }
    return false;
  }

  isHovered(toolId: string): boolean {
    return this.hoveredTool() === toolId;
  }

  /**
   * Calculate delay for staggered animation based on position
   */
  getAnimationDelay(index: number): string {
    return `${index * 30}ms`;
  }

  /**
   * Handle merge button click
   */
  onMergeClick(): void {
    this.interactionHandler.mergeSelectedHolds();
  }
}

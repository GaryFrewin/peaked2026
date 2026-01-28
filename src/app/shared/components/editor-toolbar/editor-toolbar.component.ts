import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';

/**
 * Tool item definition for the toolbar
 */
export interface ToolItem {
  id: string;
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
  /** Emitted when a tool is clicked */
  readonly toolSelected = output<string>();

  /** Currently hovered tool ID */
  readonly hoveredTool = signal<string | null>(null);

  /** Tool definitions */
  readonly tools: ToolItem[] = [
    {
      id: 'view',
      icon: '👁️',
      label: 'View Mode',
      shortcut: 'Esc',
    },
    {
      id: 'editHolds',
      icon: '📍',
      label: 'Edit Holds',
      shortcut: 'H',
      dividerAfter: true,
    },
    {
      id: 'createRoute',
      icon: '➕',
      label: 'New Route',
      shortcut: 'N',
    },
    {
      id: 'editRoute',
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

  }

  isActive(toolId: string): void {
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
}

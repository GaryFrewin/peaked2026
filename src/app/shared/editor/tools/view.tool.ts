import { inject, Injectable } from '@angular/core';
import { EditorTool } from '../editor-tool.interface';
import { EditorStore } from '../../../stores/editor.store';

/**
 * VIEW TOOL
 *
 * Passive viewing mode - no editing capabilities.
 * Provides hover feedback but clicking does nothing.
 */
@Injectable({ providedIn: 'root' })
export class ViewTool implements EditorTool {
  readonly id = 'view';
  readonly label = 'View';
  readonly icon = '👁';
  readonly shortcut = 'V';

  private readonly editorStore = inject(EditorStore);

  onActivate(): void {
    // Clear any selection when entering view mode
    this.editorStore.clearSelection();
  }

  // Note: onHoldClick is intentionally NOT implemented
  // View mode is passive - clicking holds does nothing

  onHoldHover(holdId: number): void {
    // Show hover highlight for visual feedback
    this.editorStore.setHoveredHold(holdId);
  }

  onHoldHoverEnd(_holdId: number): void {
    this.editorStore.setHoveredHold(null);
  }
}

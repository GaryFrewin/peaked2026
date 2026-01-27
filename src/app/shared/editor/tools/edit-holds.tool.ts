import { inject, Injectable } from '@angular/core';
import { EditorTool } from '../editor-tool.interface';
import { EditorStore } from '../../../stores/editor.store';

/**
 * EDIT HOLDS TOOL
 *
 * Allows selecting/deselecting holds for bulk operations.
 * Click to toggle selection, hover for highlight feedback.
 */
@Injectable({ providedIn: 'root' })
export class EditHoldsTool implements EditorTool {
  readonly id = 'editHolds';
  readonly label = 'Edit Holds';
  readonly icon = '✋';
  readonly shortcut = 'H';

  private readonly editorStore = inject(EditorStore);

  onActivate(): void {
    // Start fresh with no selection
    this.editorStore.clearSelection();
  }

  onDeactivate(): void {
    // Clear selection when leaving edit mode
    this.editorStore.clearSelection();
  }

  onHoldClick(holdId: number): void {
    this.editorStore.toggleHoldSelection(holdId);
  }

  onHoldHover(holdId: number): void {
    this.editorStore.setHoveredHold(holdId);
  }

  onHoldHoverEnd(_holdId: number): void {
    this.editorStore.setHoveredHold(null);
  }
}

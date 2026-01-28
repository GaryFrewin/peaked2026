import { Injectable, signal } from '@angular/core';
import type { Point3D } from '../shared/services/interaction/interaction-bus';

/**
 * EditHoldStateStore
 *
 * Holds all UI/interaction state for Edit Holds mode.
 * - pendingHold: The ghost hold being placed (null if none)
 * - selectedHoldIds: Set of selected holds (for multi-select, merge, delete)
 * - draggedHoldId: The hold currently being dragged (if any)
 *
 * Designed to grow as edit mode features expand.
 */
@Injectable({ providedIn: 'root' })
export class EditHoldStateStore {
  /** The ghost hold being placed (null if none) */
  readonly pendingHold = signal<Point3D | null>(null);

  /** Set of selected hold IDs (for multi-select, merge, delete) */
  readonly selectedHoldIds = signal<Set<number>>(new Set());

  /** The hold currently being dragged (null if none) */
  readonly draggedHoldId = signal<number | null>(null);

  /** Error message for edit actions (null if none) */
  readonly error = signal<string | null>(null);

  /** Clear all edit state (e.g., on mode exit) */
  clear(): void {
    this.pendingHold.set(null);
    this.selectedHoldIds.set(new Set());
    this.draggedHoldId.set(null);
    this.error.set(null);
  }
}

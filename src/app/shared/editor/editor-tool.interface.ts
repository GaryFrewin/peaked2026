/**
 * Interface for editor tools using the Strategy pattern.
 * Each tool encapsulates its own behavior for handling user interactions.
 */
export interface EditorTool {
  /** Unique identifier for the tool */
  readonly id: string;
  /** Display label for UI */
  readonly label: string;
  /** Icon (emoji or icon class) */
  readonly icon: string;
  /** Optional keyboard shortcut */
  readonly shortcut?: string;

  // Lifecycle hooks
  onActivate?(): void;
  onDeactivate?(): void;

  // Interaction handlers - tools implement only what they need
  onHoldClick?(holdId: number): void;
  onHoldHover?(holdId: number): void;
  onHoldHoverEnd?(holdId: number): void;
  onWallClick?(position: { x: number; y: number; z: number }): void;
}

import { computed, Injectable, signal } from '@angular/core';
import { EditorTool } from './editor-tool.interface';

/**
 * EDITOR SERVICE
 *
 * Facade for the editor tool system using the Strategy pattern.
 * Manages tool registration and delegates interactions to the active tool.
 *
 * RESPONSIBILITIES:
 * - Register available tools
 * - Track active tool
 * - Forward interaction events to active tool
 * - Handle tool lifecycle (activate/deactivate)
 */
@Injectable({ providedIn: 'root' })
export class EditorService {
  // Tool registry
  private readonly tools = new Map<string, EditorTool>();

  // Current active tool
  readonly activeTool = signal<EditorTool | null>(null);

  // Computed tool ID for binding
  readonly activeToolId = computed(() => this.activeTool()?.id ?? '');

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Register a tool with the editor
   */
  registerTool(tool: EditorTool): void {
    this.tools.set(tool.id, tool);
  }

  /**
   * Get all registered tools (for toolbar rendering)
   */
  getRegisteredTools(): EditorTool[] {
    return Array.from(this.tools.values());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set the active tool by ID
   */
  setTool(toolId: string): void {
    // Deactivate current tool
    this.activeTool()?.onDeactivate?.();

    // Find and activate new tool
    const tool = this.tools.get(toolId) ?? null;
    tool?.onActivate?.();

    this.activeTool.set(tool);
  }

  /**
   * Clear the active tool
   */
  clearTool(): void {
    this.activeTool()?.onDeactivate?.();
    this.activeTool.set(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERACTION HANDLERS - Forward to active tool
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle hold click event
   */
  handleHoldClick(holdId: number): void {
    this.activeTool()?.onHoldClick?.(holdId);
  }

  /**
   * Handle hold hover start event
   */
  handleHoldHover(holdId: number): void {
    this.activeTool()?.onHoldHover?.(holdId);
  }

  /**
   * Handle hold hover end event
   */
  handleHoldHoverEnd(holdId: number): void {
    this.activeTool()?.onHoldHoverEnd?.(holdId);
  }

  /**
   * Handle wall surface click event
   */
  handleWallClick(position: { x: number; y: number; z: number }): void {
    this.activeTool()?.onWallClick?.(position);
  }
}

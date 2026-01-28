/**
 * INTERACTION BUS
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SINGLE RESPONSIBILITY: Bridge A-Frame events to Angular
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This service has ONE job: transport raw interaction events from the A-Frame
 * world (DOM, WebXR) into the Angular world (services, stores).
 *
 * It does NOT:
 * - Know about editor modes (view, editHolds, createRoute)
 * - Decide what an event "means"
 * - Call stores, APIs, or trigger side effects
 * - Filter or transform events based on app state
 *
 * It ONLY:
 * - Receives events via emit methods (called from A-Frame components)
 * - Exposes observables that Angular services can subscribe to
 * - Provides a window.peakedBus global for A-Frame to call
 *
 * WHY this separation?
 * - A-Frame components run outside Angular's zone and DI
 * - We need a clean boundary between 3D/VR land and Angular land
 * - Event interpretation (mode-aware behavior) belongs in InteractionHandler
 *
 * FLOW:
 *   A-Frame component → window.peakedBus.emitX() → InteractionBus → subscribers
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * 3D point in space
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

@Injectable({ providedIn: 'root' })
export class InteractionBus implements OnDestroy {
  // ═══════════════════════════════════════════════════════════════════════════
  // SUBJECTS (private - only this service can emit)
  // ═══════════════════════════════════════════════════════════════════════════

  private readonly _holdClicked$ = new Subject<number>();
  private readonly _holdHovered$ = new Subject<number>();
  private readonly _holdUnhovered$ = new Subject<number>();
  private readonly _wallClicked$ = new Subject<Point3D>();
  private readonly _holdDragStarted$ = new Subject<number>();
  private readonly _holdDragEnded$ = new Subject<number>();

  // ═══════════════════════════════════════════════════════════════════════════
  // OBSERVABLES (public - anyone can subscribe)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Emitted when a hold is clicked. Payload: holdId */
  readonly holdClicked$: Observable<number> = this._holdClicked$.asObservable();

  /** Emitted when mouse/controller enters a hold. Payload: holdId */
  readonly holdHovered$: Observable<number> = this._holdHovered$.asObservable();

  /** Emitted when mouse/controller leaves a hold. Payload: holdId */
  readonly holdUnhovered$: Observable<number> = this._holdUnhovered$.asObservable();

  /** Emitted when wall surface is clicked. Payload: intersection point */
  readonly wallClicked$: Observable<Point3D> = this._wallClicked$.asObservable();

  /** Emitted when a hold drag operation starts (500ms press-and-hold). Payload: holdId */
  readonly holdDragStarted$: Observable<number> = this._holdDragStarted$.asObservable();

  /** Emitted when a hold drag operation ends (mouseup after drag). Payload: holdId */
  readonly holdDragEnded$: Observable<number> = this._holdDragEnded$.asObservable();

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR - Register on window for A-Frame access
  // ═══════════════════════════════════════════════════════════════════════════

  constructor() {
    // Expose on window so A-Frame components can call us
    (window as any).peakedBus = this;
    console.log('[InteractionBus] Registered on window.peakedBus');
  }

  ngOnDestroy(): void {
    // Clean up window reference
    if ((window as any).peakedBus === this) {
      delete (window as any).peakedBus;
    }

    // Complete all subjects
    this._holdClicked$.complete();
    this._holdHovered$.complete();
    this._holdUnhovered$.complete();
    this._wallClicked$.complete();
    this._holdDragStarted$.complete();
    this._holdDragEnded$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMIT METHODS (called from A-Frame components via window.peakedBus)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Called when a hold is clicked
   * @param holdId - The ID of the clicked hold
   */
  emitHoldClicked(holdId: number): void {
    this._holdClicked$.next(holdId);
  }

  /**
   * Called when mouse/controller enters a hold
   * @param holdId - The ID of the hovered hold
   */
  emitHoldHovered(holdId: number): void {
    this._holdHovered$.next(holdId);
  }

  /**
   * Called when mouse/controller leaves a hold
   * @param holdId - The ID of the unhovered hold
   */
  emitHoldUnhovered(holdId: number): void {
    this._holdUnhovered$.next(holdId);
  }

  /**
   * Called when wall surface is clicked
   * @param point - The 3D intersection point on the wall
   */
  emitWallClicked(point: Point3D): void {
    this._wallClicked$.next(point);
  }

  /**
   * Called when a hold drag operation starts (500ms press-and-hold timer completes)
   * @param holdId - The ID of the hold being dragged
   */
  emitHoldDragStarted(holdId: number): void {
    this._holdDragStarted$.next(holdId);
  }

  /**
   * Called when a hold drag operation ends (mouseup after drag)
   * @param holdId - The ID of the hold that was dragged
   */
  emitHoldDragEnded(holdId: number): void {
    this._holdDragEnded$.next(holdId);
  }
}

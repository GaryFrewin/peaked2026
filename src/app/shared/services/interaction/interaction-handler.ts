import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { InteractionBus } from './interaction-bus';
import { ModeStore, AppMode } from '../../../stores/mode.store';
import { HoldStore } from '../../../stores/hold.store';
import { WallStore } from '../../../stores/wall.store';

/**
 * INTERACTION HANDLER
 *
 * Routes interaction events to mode-specific behavior.
 * Subscribes to InteractionBus and checks ModeStore to decide what to do.
 */
@Injectable({ providedIn: 'root' })
export class InteractionHandler implements OnDestroy {
  private readonly bus = inject(InteractionBus);
  private readonly modeStore = inject(ModeStore);
  private readonly subscriptions = new Subscription();
  // Inject EditHoldStateStore and HoldStore for edit holds mode
  private readonly holdStore = inject(HoldStore); 
  private readonly wallStore = inject(WallStore);

  constructor() {
    this.subscriptions.add(
      this.bus.holdClicked$.subscribe(holdId => this.onHoldClicked(holdId))
    );
    this.subscriptions.add(
      this.bus.wallClicked$.subscribe(point => this.onWallClicked(point))
    );
    this.subscriptions.add(
      this.bus.holdDragStarted$.subscribe(holdId => this.onHoldDragStarted(holdId))
    );
    this.subscriptions.add(
      this.bus.holdDragEnded$.subscribe(holdId => this.onHoldDragEnded(holdId))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private onWallClicked(point: { x: number; y: number; z: number }): void {
    const mode = this.modeStore.mode();
    
    switch (mode) {
      case AppMode.View:
        console.log('[View] Wall clicked at:', point);
        // No action in view mode for wall clicks
        break;
      case AppMode.EditHolds:
        // Create a new hold at this position
        const wallId = this.wallStore.selectedWallId()!;
        const versionId = this.wallStore.selectedVersionId()!;
        this.holdStore.createHold(wallId, versionId, { x: point.x, y: point.y, z: point.z });
        
        break;
      case AppMode.CreateRoute:
        console.log('[CreateRoute] Wall clicked at:', point);
        break;
      case AppMode.EditRoute:
        console.log('[EditRoute] Wall clicked at:', point);
        break;
    }
  } 


  private onHoldClicked(holdId: number): void {
    const mode = this.modeStore.mode();

    switch (mode) {
      case AppMode.View:
        console.log('[View] Hold clicked:', holdId);
        // TODO: Set selectedHoldId in HoldStore
        // HoldDetailsPanel component reacts to show hold info
        break;

      case AppMode.EditHolds:
        console.log('[EditHolds] Hold clicked:', holdId);
        // TODO: Toggle holdId in HoldStore.selectedHoldIds (Set<number>)
        // Selected holds can be deleted, moved, or edited via toolbar
        break;

      case AppMode.CreateRoute:
        console.log('[CreateRoute] Hold clicked:', holdId);
        // TODO: Add/remove hold from RouteInProgress.holds[]
        break;

      case AppMode.EditRoute:
        console.log('[EditRoute] Hold clicked:', holdId);
        // TODO: Toggle hold in/out of the route being edited
        break;
    }
  }

  private onHoldDragStarted(holdId: number): void {
    const mode = this.modeStore.mode();
    
    // Only enable dragging in EditHolds mode
    if (mode !== AppMode.EditHolds) {
      return;
    }

    console.log('[EditHolds] Hold drag started:', holdId);
    
    // Find the hold entity in the scene and attach the drag-hold component
    const holdEntity = document.querySelector(`[data-hold-id="${holdId}"]`);
    if (holdEntity) {
      holdEntity.setAttribute('drag-hold', '');
    } else {
      console.warn(`Could not find hold entity with id ${holdId}`);
    }
  }

  private onHoldDragEnded(holdId: number): void {
    const mode = this.modeStore.mode();
    
    // Only process drag end in EditHolds mode
    if (mode !== AppMode.EditHolds) {
      return;
    }

    console.log('[EditHolds] Hold drag ended:', holdId);
    
    // Find the hold entity and remove the drag-hold component
    const holdEntity = document.querySelector(`[data-hold-id="${holdId}"]`) as any;
    if (holdEntity) {
      // Capture final position before removing component (A-Frame returns object with x, y, z)
      const position = holdEntity.getAttribute('position');
      
      // Remove the drag component
      holdEntity.removeAttribute('drag-hold');
      
      // Update the hold in the store (triggers API call)
      const wallId = this.wallStore.selectedWallId()!;
      const versionId = this.wallStore.selectedVersionId()!;
      
      if (position && typeof position === 'object') {
        this.holdStore.updateHold(wallId, versionId, holdId, {
          x: position.x,
          y: position.y,
          z: position.z
        });
      }
    } else {
      console.warn(`Could not find hold entity with id ${holdId}`);
    }
  }
}

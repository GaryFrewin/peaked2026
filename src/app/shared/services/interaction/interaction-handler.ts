import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { InteractionBus } from './interaction-bus';
import { ModeStore, AppMode } from '../../../stores/mode.store';

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

  constructor() {
    this.subscriptions.add(
      this.bus.holdClicked$.subscribe(holdId => this.onHoldClicked(holdId))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private onHoldClicked(holdId: number): void {
    const mode = this.modeStore.mode();

    switch (mode) {
      case AppMode.View:
        // PSEUDOCODE:
        // 1. Set selectedHoldId in HoldStore
        // 2. HoldDetailsPanel component reacts to show hold info
        // 3. If a route contains this hold, maybe highlight that route?
        break;

      case AppMode.EditHolds:
        // PSEUDOCODE:
        // 1. Toggle holdId in HoldStore.selectedHoldIds (Set<number>)
        // 2. If now selected: hold renders yellow/highlighted
        // 3. If now deselected: hold renders normal color
        // 4. Selected holds can then be deleted, moved, or edited via toolbar actions
        break;

      case AppMode.CreateRoute:
        // PSEUDOCODE:
        // 1. Add hold to RouteInProgress.holds[] (if not already in)
        //    - Or remove if already in (toggle behavior)
        // 2. Prompt: is this a start hold? (hand/foot, forward/reverse)
        // 3. Hold renders in "route color" to show it's part of route
        // 4. Route line/path updates to include this hold
        break;

      case AppMode.EditRoute:
        // PSEUDOCODE:
        // 1. Same as CreateRoute, but we're editing an existing route
        // 2. Toggle hold in/out of the route
        // 3. If removing a start hold, clear that start marker
        // 4. Track changes for save/cancel
        break;
    }
  }
}

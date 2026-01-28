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
}

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateRouteStateStore } from '../../../stores/create-route-state.store';
import { RouteStore } from '../../../stores/route.store';
import { HoldStore } from '../../../stores/hold.store';
import { WallStore } from '../../../stores/wall.store';
import { ModeStore } from '../../../stores/mode.store';
import { RouteNameGeneratorService } from '../../../shared/services/route-name-generator.service';
import { createRoute } from '../../../data-contracts/route.model';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

/**
 * ROUTE CREATION PANEL
 *
 * Desktop sidebar for building new routes.
 * Shows hold list, flag indicators, metadata form.
 * Save is handled by the toolbar save button.
 *
 * Workflow:
 * 1. User clicks holds in scene (added to draft route)
 * 2. User right-clicks to cycle flags
 * 3. User fills metadata form
 * 4. Toolbar Save button (validates min 2 holds) → API call
 */
@Component({
  selector: 'app-route-creation-panel',
  standalone: true,
  imports: [
    FormsModule,
    InputTextModule,
    InputNumberModule,
    MultiSelectModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './route-creation-panel.html',
  styleUrl: './route-creation-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteCreationPanelComponent implements OnInit {
  private readonly createRouteState = inject(CreateRouteStateStore);
  private readonly routeStore = inject(RouteStore);
  private readonly holdStore = inject(HoldStore);
  private readonly wallStore = inject(WallStore);
  private readonly modeStore = inject(ModeStore);
  private readonly nameGenerator = inject(RouteNameGeneratorService);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  readonly routeName = signal(this.nameGenerator.generateRouteName());
  readonly forwardGrade = signal(0);
  readonly reverseGrade = signal(0);
  readonly forwardStarRating = signal<number | null>(null);
  readonly reverseStarRating = signal<number | null>(null);
  readonly selectedStyles = signal<any[]>([]);
  readonly notes = signal('');

  ngOnInit(): void {
    // Load styles from API for the dropdown
    this.routeStore.loadStyles();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  readonly draftRoute = this.createRouteState.draftRoute;
  readonly styles = this.routeStore.styles;

  /** Hold count for display */
  readonly holdCount = computed(() => {
    return this.draftRoute()?.route_holds.length ?? 0;
  });

  /** Can save if name + min 2 holds */
  readonly canSave = computed(() => {
    const name = this.routeName().trim();
    const holdCount = this.holdCount();
    return name.length > 0 && holdCount >= 2;
  });

  /** Holds with full data for list display */
  readonly holdsWithData = computed(() => {
    const draft = this.draftRoute();
    if (!draft) return [];

    const allHolds = this.holdStore.holds();
    return draft.route_holds.map((rh) => {
      const hold = allHolds.find((h) => h.id === rh.hold_id);
      return {
        routeHold: rh,
        hold,
      };
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Remove hold from draft route
   */
  removeHold(holdId: number): void {
    this.createRouteState.removeHold(holdId);
  }

  /**
   * Cycle hold flags (right-click equivalent)
   */
  cycleHoldFlags(holdId: number): void {
    this.createRouteState.cycleHoldFlags(holdId);
  }

  /**
   * Save route with validation
   */
  save(): void {
    if (!this.canSave()) {
      return;
    }

    const draft = this.draftRoute();
    if (!draft) {
      return;
    }

    const wallId = this.wallStore.selectedWallId();
    const versionId = this.wallStore.selectedVersionId();

    if (!wallId || !versionId) {
      alert('No wall/version selected');
      return;
    }

    // Build final route object
    const route = createRoute({
      name: this.routeName().trim(),
      wallversion_id: versionId,
      route_holds: draft.route_holds,
      forward_grade: this.forwardGrade(),
      reverse_grade: this.reverseGrade() ?? undefined,
      forward_star_rating: this.forwardStarRating() ?? undefined,
      reverse_star_rating: this.reverseStarRating() ?? undefined,
      styles: this.selectedStyles().length > 0 ? this.selectedStyles() : undefined,
      notes: this.notes().trim() || undefined,
    });

    // Save via RouteStore
    this.routeStore.saveRoute(route);

    // Exit CreateRoute mode
    this.modeStore.exitToView();

    // Reset form
    this.resetForm();
  }

  /**
   * Cancel route creation
   */
  cancel(): void {
    const hasHolds = this.holdCount() > 0;

    if (hasHolds) {
      const confirmed = confirm('Discard route? All holds and metadata will be lost.');
      if (!confirmed) {
        return;
      }
    }

    this.modeStore.exitToView();
    this.resetForm();
  }

  /**
   * Get flag indicator text for a hold
   */
  getFlagIndicator(rh: any): string {
    const flags: string[] = [];
    if (rh.forwardhandstart) flags.push('FH');
    if (rh.forwardfootstart) flags.push('FF');
    if (rh.reversehandstart) flags.push('RH');
    if (rh.reversefootstart) flags.push('RF');
    return flags.length > 0 ? flags.join(' ') : '—';
  }

  /**
   * Get color class for hold based on flags
   */
  getHoldColorClass(rh: any): string {
    const isStart = rh.forwardhandstart || rh.forwardfootstart;
    const isEnd = rh.reversehandstart || rh.reversefootstart;

    if (isStart && isEnd) return 'hold-link';
    if (isStart) return 'hold-start';
    if (isEnd) return 'hold-end';
    return 'hold-regular';
  }

  private resetForm(): void {
    this.routeName.set(this.nameGenerator.generateRouteName());
    this.forwardGrade.set(0);
    this.reverseGrade.set(0);
    this.forwardStarRating.set(null);
    this.reverseStarRating.set(null);
    this.selectedStyles.set([]);
    this.notes.set('');
  }
}

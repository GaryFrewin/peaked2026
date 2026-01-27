import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ClimbStore } from '../../../stores/climb.store';

interface NewClimb {
  distance: number | null;
  grade: string;
  difficulty: number;
  notes: string;
}

@Component({
  selector: 'app-distance-logger',
  templateUrl: './distance-logger.component.html',
  styleUrl: './distance-logger.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    SliderModule,
    FormsModule,
    DatePipe,
  ],
})
export class DistanceLoggerComponent implements OnInit {
  private readonly store = inject(ClimbStore);

  // ─────────────────────────────────────────────────────────────────────────
  // STORE BINDINGS (read-only access to store state)
  // ─────────────────────────────────────────────────────────────────────────

  protected readonly climbs = this.store.climbs;
  protected readonly isLoading = this.store.isLoading;
  protected readonly error = this.store.error;
  protected readonly todaysDistance = this.store.todaysDistance;
  protected readonly dailyGoal = this.store.dailyGoal;
  protected readonly totalDistanceAllTime = this.store.totalDistanceAllTime;
  protected readonly totalClimbsAllTime = this.store.totalClimbsAllTime;
  protected readonly averageDifficulty = this.store.averageDifficulty;

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATION STATE
  // ─────────────────────────────────────────────────────────────────────────

  /** Displayed value that animates toward todaysDistance */
  protected readonly displayedDistance = signal(0);

  /** Displayed progress percent that animates toward progressPercent */
  protected readonly displayedProgress = signal(0);

  private animationFrameId: number | null = null;
  private hasAnimatedInitial = false;

  constructor() {
    // Watch for loading to complete and trigger animation
    effect(() => {
      const loading = this.isLoading();
      const distance = this.todaysDistance();
      
      // When loading finishes (transitions from true to false), animate
      if (!loading && !this.hasAnimatedInitial) {
        this.hasAnimatedInitial = true;
        setTimeout(() => this.animateToValue(distance), 50);
      }
    });
  }

  ngOnInit(): void {
    this.store.loadClimbs();
  }

  private animateToValue(target: number): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const start = this.displayedDistance();
    const startProgress = this.displayedProgress();
    const targetProgress = Math.min(100, (target / this.dailyGoal()) * 100);
    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(start + (target - start) * eased);
      const currentProgressValue = startProgress + (targetProgress - startProgress) * eased;

      this.displayedDistance.set(currentValue);
      this.displayedProgress.set(currentProgressValue);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────

  protected readonly showAddModal = signal(false);

  protected readonly newClimb = signal<NewClimb>({
    distance: null,
    grade: '6a',
    difficulty: 5,
    notes: '',
  });

  protected readonly gradeOptions = [
    '4', '4+', '5', '5+',
    '6a', '6a+', '6b', '6b+', '6c', '6c+',
    '7a', '7a+', '7b', '7b+', '7c', '7c+',
    '8a', '8a+',
  ];

  protected readonly distanceShortcuts = [8, 16, 24, 32];

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  openAddModal(): void {
    this.newClimb.set({ distance: null, grade: '6a', difficulty: 5, notes: '' });
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  setDistance(distance: number): void {
    this.newClimb.update((c) => ({ ...c, distance }));
  }

  setGrade(grade: string): void {
    this.newClimb.update((c) => ({ ...c, grade }));
  }

  setDifficulty(difficulty: number): void {
    this.newClimb.update((c) => ({ ...c, difficulty }));
  }

  async addClimb(): Promise<void> {
    const climb = this.newClimb();
    if (!climb.distance || climb.distance <= 0) return;

    const success = await this.store.addClimb({
      date: new Date().toISOString().split('T')[0],
      distance: climb.distance,
      grade: climb.grade,
      difficulty: climb.difficulty,
      notes: climb.notes || undefined,
    });

    if (success) {
      this.closeAddModal();
      // Animate to new total
      setTimeout(() => this.animateToValue(this.todaysDistance()), 50);
    }
  }

  async deleteClimb(id: number): Promise<void> {
    const success = await this.store.deleteClimb(id);
    if (success) {
      // Animate to new total
      setTimeout(() => this.animateToValue(this.todaysDistance()), 50);
    }
  }

  goBack(): void {
    window.history.back();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private gradeToDifficulty(grade: string): number {
    const mapping: Record<string, number> = {
      '4': 1, '4+': 2, '5': 2, '5+': 3,
      '6a': 4, '6a+': 5, '6b': 5, '6b+': 6, '6c': 6, '6c+': 7,
      '7a': 7, '7a+': 8, '7b': 8, '7b+': 9, '7c': 9, '7c+': 10,
      '8a': 10, '8a+': 10,
    };
    return mapping[grade] ?? 5;
  }

  protected getDifficultyColor(difficulty: number): string {
    if (difficulty <= 3) return 'var(--pk-success)';
    if (difficulty <= 5) return 'var(--pk-info)';
    if (difficulty <= 7) return 'var(--pk-warning)';
    return 'var(--pk-danger)';
  }

  protected formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModeIndicatorComponent } from './shared/components/mode-indicator/mode-indicator.component';
import { InteractionHandler } from './shared/services/interaction/interaction-handler';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ModeIndicatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Inject to ensure it's instantiated at app startup
  private readonly interactionHandler = inject(InteractionHandler);

  protected readonly title = signal('peaked2026');
}

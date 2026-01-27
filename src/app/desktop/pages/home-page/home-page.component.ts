import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';

interface PlaygroundItem {
  label: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TabsModule, ButtonModule],
})
export class HomePageComponent {
  private readonly router = inject(Router);

  protected readonly activeTab = signal<string>('modes');

  protected readonly playgrounds: PlaygroundItem[] = [
    { label: 'Basic Scene', route: 'basic', description: 'Simple A-Frame test' },
    { label: 'GLTF Loader', route: 'gltf-loader', description: 'Load 3D models' },
    { label: 'Hold Loader', route: 'hold-loader', description: 'Climbing holds' },
  ];

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  goToVrMode(): void {
    this.router.navigate(['/vr/viewer']);
  }

  goToDesktopMode(): void {
    this.router.navigate(['/desktop/viewer']);
  }

  goToDistanceLogger(): void {
    this.router.navigate(['/distance-logger']);
  }

  goToPlayground(route: string): void {
    this.router.navigate([`/vr/${route}`]);
  }
}

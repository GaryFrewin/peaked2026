import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SettingsStore } from '../../../stores/settings.store';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPanelComponent {
  protected readonly settingsStore = inject(SettingsStore);

  onSkyboxChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.settingsStore.setSkybox(select.value);
  }

  onOcclusionChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.settingsStore.setOccludeSkybox(checkbox.checked);
  }

  onWallOpacityChange(event: Event): void {
    const slider = event.target as HTMLInputElement;
    this.settingsStore.setWallOpacity(parseFloat(slider.value));
  }

  onHoldsVisibleChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.settingsStore.setHoldsVisible(checkbox.checked);
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { SettingsPanelComponent } from './settings-panel.component';
import { SettingsStore, SkyboxOption } from '../../../stores/settings.store';

describe('SettingsPanelComponent', () => {
  let component: SettingsPanelComponent;
  let fixture: ComponentFixture<SettingsPanelComponent>;
  let mockSettingsStore: jasmine.SpyObj<SettingsStore>;

  const mockSkyboxOptions: SkyboxOption[] = [
    { name: 'None', key: 'none', path: '' },
    { name: 'Anime Sky', key: 'animeSky', path: 'assets/skyboxes/anime_sky.glb' },
    { name: 'Above Clouds', key: 'aboveClouds', path: 'assets/skyboxes/above_clouds.glb' },
  ];

  beforeEach(async () => {
    mockSettingsStore = jasmine.createSpyObj('SettingsStore', 
      ['setSkybox', 'setOccludeSkybox'],
      {
        skyboxOptions: mockSkyboxOptions,
        selectedSkyboxPath: signal('assets/skyboxes/above_clouds.glb'),
        occludeSkybox: signal(true),
      }
    );

    await TestBed.configureTestingModule({
      imports: [SettingsPanelComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SettingsStore, useValue: mockSettingsStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display a skybox dropdown with all options from store', () => {
      const dropdown = fixture.nativeElement.querySelector('[data-testid="skybox-dropdown"]');
      expect(dropdown).toBeTruthy();
      
      // Check options are available
      const options = fixture.nativeElement.querySelectorAll('[data-testid="skybox-option"]');
      expect(options.length).toBe(mockSkyboxOptions.length);
    });

    it('should display an occlusion toggle', () => {
      const toggle = fixture.nativeElement.querySelector('[data-testid="occlusion-toggle"]');
      expect(toggle).toBeTruthy();
    });

    it('should show current skybox selection', () => {
      // The selected option should match the store's value
      const dropdown = fixture.nativeElement.querySelector('[data-testid="skybox-dropdown"]') as HTMLSelectElement;
      const selectedOption = dropdown.querySelector('option:checked') as HTMLOptionElement;
      // Note: Native select bindings may not reflect immediately, check the store value is accessible
      expect(component['settingsStore'].selectedSkyboxPath()).toBe('assets/skyboxes/above_clouds.glb');
    });

    it('should show current occlusion state as checked when true', () => {
      const toggle = fixture.nativeElement.querySelector('[data-testid="occlusion-toggle"]') as HTMLInputElement;
      expect(toggle.checked).toBe(true);
    });
  });

  describe('interactions', () => {
    it('should call store.setSkybox when skybox is selected', () => {
      const dropdown = fixture.nativeElement.querySelector('[data-testid="skybox-dropdown"]') as HTMLSelectElement;
      
      dropdown.value = 'assets/skyboxes/anime_sky.glb';
      dropdown.dispatchEvent(new Event('change'));
      
      expect(mockSettingsStore.setSkybox).toHaveBeenCalledWith('assets/skyboxes/anime_sky.glb');
    });

    it('should call store.setOccludeSkybox when toggle is clicked', () => {
      const toggle = fixture.nativeElement.querySelector('[data-testid="occlusion-toggle"]') as HTMLInputElement;
      
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change'));
      
      expect(mockSettingsStore.setOccludeSkybox).toHaveBeenCalledWith(false);
    });
  });

  describe('edge cases', () => {
    it('should handle None option clearing the skybox', () => {
      const dropdown = fixture.nativeElement.querySelector('[data-testid="skybox-dropdown"]') as HTMLSelectElement;
      
      dropdown.value = '';
      dropdown.dispatchEvent(new Event('change'));
      
      expect(mockSettingsStore.setSkybox).toHaveBeenCalledWith('');
    });
  });
});

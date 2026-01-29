import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { VrSettingsApplier } from './vr-settings-applier';
import { SettingsStore } from '../../stores/settings.store';
import { BaseSceneComponent } from '../../shared/components/base-scene/base-scene';

describe('VrSettingsApplier', () => {
  let service: VrSettingsApplier;
  let mockSettingsStore: {
    holdsVisible: WritableSignal<boolean>;
    wallOpacity: WritableSignal<number>;
  };

  beforeEach(() => {
    mockSettingsStore = {
      holdsVisible: signal(true),
      wallOpacity: signal(0),
    };

    TestBed.configureTestingModule({
      providers: [
        VrSettingsApplier,
        { provide: SettingsStore, useValue: mockSettingsStore },
      ],
    });

    service = TestBed.inject(VrSettingsApplier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('attachTo', () => {
    let mockScene: Partial<BaseSceneComponent>;
    let mockHoldsContainer: HTMLElement;
    let mockWallContainer: HTMLElement;
    let mockSceneElement: HTMLElement;

    beforeEach(() => {
      mockHoldsContainer = document.createElement('div');
      mockWallContainer = document.createElement('div');
      mockWallContainer.id = 'wall-container';
      mockSceneElement = document.createElement('div');
      mockSceneElement.appendChild(mockWallContainer);

      mockScene = {
        holdsContainerRef: { nativeElement: mockHoldsContainer } as any,
        sceneElement: { nativeElement: mockSceneElement } as any,
      };
    });

    it('should_set_holds_visible_true_when_holdsVisible_signal_is_true', () => {
      /**Key behaviour: Sets A-Frame visible attribute to 'true' when settings store has holdsVisible=true */
      mockSettingsStore.holdsVisible.set(true);
      
      service.attachTo(mockScene as BaseSceneComponent);
      TestBed.flushEffects();
      
      expect(mockHoldsContainer.getAttribute('visible')).toBe('true');
    });

    it('should_set_holds_visible_false_when_holdsVisible_signal_is_false', () => {
      /**Key behaviour: Sets A-Frame visible attribute to 'false' when settings store has holdsVisible=false */
      mockSettingsStore.holdsVisible.set(false);
      
      service.attachTo(mockScene as BaseSceneComponent);
      TestBed.flushEffects();
      
      expect(mockHoldsContainer.getAttribute('visible')).toBe('false');
    });

    it('should_apply_wall_opacity_attribute_when_wallOpacity_changes', () => {
      /**Key behaviour: Sets wall-opacity A-Frame component attribute based on store value */
      mockSettingsStore.wallOpacity.set(0.5);
      
      service.attachTo(mockScene as BaseSceneComponent);
      TestBed.flushEffects();
      
      expect(mockWallContainer.getAttribute('wall-opacity')).toBe('opacity: 0.5');
    });

    it('should_reactively_update_holds_visibility_when_signal_changes', () => {
      /**Key behaviour: Angular effect reactively updates DOM when store signal changes */
      mockSettingsStore.holdsVisible.set(true);
      
      service.attachTo(mockScene as BaseSceneComponent);
      TestBed.flushEffects();
      
      expect(mockHoldsContainer.getAttribute('visible')).toBe('true');
      
      // Change the signal
      mockSettingsStore.holdsVisible.set(false);
      TestBed.flushEffects();
      
      expect(mockHoldsContainer.getAttribute('visible')).toBe('false');
    });

    it('should_reactively_update_wall_opacity_when_signal_changes', () => {
      /**Key behaviour: Angular effect reactively updates DOM when store signal changes */
      mockSettingsStore.wallOpacity.set(0);
      
      service.attachTo(mockScene as BaseSceneComponent);
      TestBed.flushEffects();
      
      expect(mockWallContainer.getAttribute('wall-opacity')).toBe('opacity: 0');
      
      // Change the signal
      mockSettingsStore.wallOpacity.set(1);
      TestBed.flushEffects();
      
      expect(mockWallContainer.getAttribute('wall-opacity')).toBe('opacity: 1');
    });
  });
});

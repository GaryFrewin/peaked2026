/**
 * VrCalibrationPageComponent Tests
 *
 * Tests for the VR calibration page that guides users through
 * wall calibration in AR mode.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';

import { VrCalibrationPageComponent } from './vr-calibration-page';
import { CalibrationStore } from '../../../stores/calibration.store';
import { WallStore } from '../../../stores/wall.store';

describe('VrCalibrationPageComponent', () => {
  let component: VrCalibrationPageComponent;
  let fixture: ComponentFixture<VrCalibrationPageComponent>;
  let mockCalibrationStore: jasmine.SpyObj<CalibrationStore>;
  let mockWallStore: Partial<WallStore>;

  beforeEach(async () => {
    // Create mock CalibrationStore with signals
    mockCalibrationStore = jasmine.createSpyObj(
      'CalibrationStore',
      ['nextPhase', 'setCanProceed', 'reset'],
      {
        currentPhase: signal<string>('welcome'),
        passthroughEnabled: signal<boolean>(false),
        canProceed: signal<boolean>(false),
      }
    );

    // Create mock WallStore with signals
    mockWallStore = {
      walls: signal<any[]>([]),
      selectedWall: signal<any>(null),
      modelPath: signal<string | null>(null),
      loadWalls: jasmine.createSpy('loadWalls'),
      selectWall: jasmine.createSpy('selectWall'),
      selectVersion: jasmine.createSpy('selectVersion'),
    };

    await TestBed.configureTestingModule({
      imports: [VrCalibrationPageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: CalibrationStore, useValue: mockCalibrationStore },
        { provide: WallStore, useValue: mockWallStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VrCalibrationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('BEGIN button interaction', () => {
    it('should call onBeginClick when BEGIN button emits vr-button-click', () => {
      const consoleSpy = spyOn(console, 'log');

      component.onBeginClick();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[VrCalibrationPage] BEGIN clicked'
      );
    });
  });

  describe('Step 2 - Wall Model Loading', () => {
    it('should expose modelPath from WallStore', () => {
      // Verify the component exposes the modelPath signal
      expect(component.modelPath).toBeDefined();
      expect(component.modelPath()).toBeNull();
    });

    it('should return model path when wall version is selected', () => {
      // Update the mock to have a model path
      (mockWallStore.modelPath as any).set(
        'https://example.com/models/wall.glb'
      );

      expect(component.modelPath()).toBe(
        'https://example.com/models/wall.glb'
      );
    });

    it('should show wall-container when in step2', () => {
      // Set phase to step2
      (mockCalibrationStore.currentPhase as any).set('step2');
      fixture.detectChanges();

      expect(component.showStep2Panel()).toBe(true);
    });

    it('should hide wall-container when not in step2', () => {
      // Phase is 'welcome' by default
      expect(component.showStep2Panel()).toBe(false);

      // Set to step1
      (mockCalibrationStore.currentPhase as any).set('step1');
      fixture.detectChanges();
      expect(component.showStep2Panel()).toBe(false);
    });
  });
});

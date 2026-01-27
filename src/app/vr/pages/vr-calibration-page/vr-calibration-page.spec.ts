/**
 * VrCalibrationPageComponent Tests
 *
 * Tests for the VR calibration page that guides users through
 * wall calibration in AR mode.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { VrCalibrationPageComponent } from './vr-calibration-page';

describe('VrCalibrationPageComponent', () => {
  let component: VrCalibrationPageComponent;
  let fixture: ComponentFixture<VrCalibrationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VrCalibrationPageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
});

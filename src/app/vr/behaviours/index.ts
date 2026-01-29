/**
 * A-Frame Behaviours Index
 * 
 * Import this file to register all custom A-Frame components.
 * Should be imported once in the app, typically in the VR scene component.
 */

// Shared behaviours (wall-opacity, etc)
import '../../shared/aframe-components/behaviours/wall-opacity';

// Skybox effects
import './skybox/dynamic-skybox';
import './skybox/occlude-skybox';
import './skybox';

// VR-specific UI
import './vr-button';

// Auto-register calibrated-anchor for anchor restoration in VR scenes
import { registerCalibratedAnchorComponent } from './calibration/calibrated-anchor';
registerCalibratedAnchorComponent();

// Re-export registration functions for components that need explicit registration
export { registerVrButtonComponent } from './vr-button';
export { registerMarkerPlacerComponent } from './calibration/marker-placer';
export { registerWallManipulatorComponent } from './calibration/wall-manipulator';
export { registerSurfaceCursorComponent } from './calibration/surface-cursor';
export { registerTriangleAlignComponent } from './calibration/triangle-align';
export { registerCalibratedAnchorComponent } from './calibration/calibrated-anchor';

console.log('[behaviours] VR A-Frame behaviours registered');

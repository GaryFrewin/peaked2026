/**
 * A-Frame Behaviours Index
 * 
 * Import this file to register all custom A-Frame components.
 * Should be imported once in the app, typically in the VR scene component.
 */

import './dynamic-skybox';
import './occlude-skybox';
import './wall-opacity';

// Auto-register calibrated-anchor for anchor restoration in VR scenes
import { registerCalibratedAnchorComponent } from './calibrated-anchor';
registerCalibratedAnchorComponent();

// Auto-register desktop-interaction-manager for mouse event capture
import { registerDesktopInteractionManager } from './desktop-interaction-manager';
registerDesktopInteractionManager();

// Re-export registration functions for components that need explicit registration
export { registerVrButtonComponent } from './vr-button';
export { registerMarkerPlacerComponent } from './marker-placer';
export { registerWallManipulatorComponent } from './wall-manipulator';
export { registerSurfaceCursorComponent } from './surface-cursor';
export { registerTriangleAlignComponent } from './triangle-align';
export { registerWireframeRevealBehaviour } from './wireframe-reveal/wireframe-reveal';
export { registerCalibratedAnchorComponent } from './calibrated-anchor';
export { registerDesktopInteractionManager } from './desktop-interaction-manager';

console.log('[behaviours] A-Frame behaviours registered');

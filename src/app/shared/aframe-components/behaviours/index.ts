/**
 * Shared A-Frame Behaviours Index
 * 
 * Platform-agnostic A-Frame components that work in both desktop and VR contexts.
 * These handle visual effects, animations, and UI feedback.
 */

import './selected-hold';
import './hold-pulser';
import './mode-hold-colorizer';
import './wall-opacity';
import './wave-animator';

export { registerWireframeRevealBehaviour } from './wireframe-reveal/wireframe-reveal';

console.log('[shared-behaviours] Shared A-Frame behaviours registered');

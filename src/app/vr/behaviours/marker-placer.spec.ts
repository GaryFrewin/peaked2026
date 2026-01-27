/**
 * Marker Placer Component Tests
 *
 * Tests for the A-Frame component that handles placing calibration markers
 * at the controller tip position.
 */

import { registerMarkerPlacerComponent } from './marker-placer';

describe('MarkerPlacerComponent', () => {
  let mockEl: any;
  let mockScene: any;
  let component: any;
  let eventListeners: Map<string, Function>;

  beforeEach(() => {
    // Set up mock A-Frame environment
    eventListeners = new Map();

    // Mock ghost marker element
    const mockGhostMarker = {
      setAttribute: jasmine.createSpy('setAttribute'),
      object3D: {
        position: { copy: jasmine.createSpy('copy') },
      },
    };

    // Mock real marker elements
    const createMockMarker = (id: string) => ({
      id,
      setAttribute: jasmine.createSpy('setAttribute'),
      object3D: {
        position: { copy: jasmine.createSpy('copy') },
      },
    });

    const mockMarkers = {
      'ghost-marker': mockGhostMarker,
      'real-marker-1': createMockMarker('real-marker-1'),
      'real-marker-2': createMockMarker('real-marker-2'),
      'real-marker-3': createMockMarker('real-marker-3'),
    };

    // Mock scene
    mockScene = {
      querySelector: (selector: string) => {
        const id = selector.replace('#', '');
        return (mockMarkers as any)[id] || null;
      },
    };

    // Mock controller element
    mockEl = {
      sceneEl: mockScene,
      addEventListener: jasmine.createSpy('addEventListener').and.callFake(
        (event: string, handler: Function) => {
          eventListeners.set(event, handler);
        }
      ),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      emit: jasmine.createSpy('emit'),
      object3D: {
        getWorldPosition: jasmine
          .createSpy('getWorldPosition')
          .and.callFake((target: any) => {
            target.x = 0;
            target.y = 1.5;
            target.z = -1;
            return target;
          }),
        getWorldDirection: jasmine
          .createSpy('getWorldDirection')
          .and.callFake((target: any) => {
            target.x = 0;
            target.y = 0;
            target.z = -1;
            return target;
          }),
      },
    };

    // Mock AFRAME global
    (window as any).AFRAME = {
      registerComponent: jasmine
        .createSpy('registerComponent')
        .and.callFake((name: string, definition: any) => {
          // Store the component definition so we can test it
          (window as any).AFRAME.components =
            (window as any).AFRAME.components || {};
          (window as any).AFRAME.components[name] = definition;
        }),
      components: {},
      THREE: {
        Vector3: class {
          x = 0;
          y = 0;
          z = 0;
          add(v: any) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            return this;
          }
          multiplyScalar(s: number) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
          }
          clone() {
            const v = new (window as any).AFRAME.THREE.Vector3();
            v.x = this.x;
            v.y = this.y;
            v.z = this.z;
            return v;
          }
        },
      },
    };

    // Register the component
    registerMarkerPlacerComponent();

    // Get component definition and create instance
    const componentDef = (window as any).AFRAME.components['marker-placer'];
    component = {
      el: mockEl,
      data: { enabled: false, maxMarkers: 3 },
      ...componentDef,
    };

    // Initialize
    component.init.call(component);
  });

  afterEach(() => {
    delete (window as any).AFRAME;
  });

  describe('marker placement', () => {
    it('should increment marker count when A button pressed while enabled', () => {
      component.data.enabled = true;

      // Trigger A button
      const aButtonHandler = eventListeners.get('abuttondown');
      expect(aButtonHandler).toBeDefined();
      aButtonHandler!();

      expect(component.markersPlaced).toBe(1);
    });

    it('should store position when marker placed', () => {
      component.data.enabled = true;

      // Place first marker
      const aButtonHandler = eventListeners.get('abuttondown');
      aButtonHandler!();

      const positions = component.getMarkerPositions();
      expect(positions.length).toBe(1);
      expect(positions[0]).toEqual(
        jasmine.objectContaining({
          x: jasmine.any(Number),
          y: jasmine.any(Number),
          z: jasmine.any(Number),
        })
      );
    });

    it('should emit marker-placed event with count and positions', () => {
      component.data.enabled = true;

      const aButtonHandler = eventListeners.get('abuttondown');
      aButtonHandler!();

      expect(mockEl.emit).toHaveBeenCalledWith(
        'marker-placed',
        jasmine.objectContaining({
          count: 1,
          positions: jasmine.any(Array),
        })
      );
    });

    it('should not place marker when disabled', () => {
      component.data.enabled = false;

      const aButtonHandler = eventListeners.get('abuttondown');
      aButtonHandler!();

      expect(component.markersPlaced).toBe(0);
      expect(mockEl.emit).not.toHaveBeenCalled();
    });

    it('should not place beyond maxMarkers limit', () => {
      component.data.enabled = true;
      component.data.maxMarkers = 3;

      const aButtonHandler = eventListeners.get('abuttondown');

      // Place 3 markers
      aButtonHandler!();
      aButtonHandler!();
      aButtonHandler!();

      expect(component.markersPlaced).toBe(3);

      // Try to place 4th
      aButtonHandler!();

      expect(component.markersPlaced).toBe(3); // Still 3
    });
  });

  describe('getMarkerPositions', () => {
    it('should return placed marker positions', () => {
      component.data.enabled = true;

      const aButtonHandler = eventListeners.get('abuttondown');
      aButtonHandler!();
      aButtonHandler!();

      const positions = component.getMarkerPositions();
      expect(positions.length).toBe(2);
    });

    it('should return empty array when no markers placed', () => {
      const positions = component.getMarkerPositions();
      expect(positions).toEqual([]);
    });
  });
});

/**
 * Surface Cursor A-Frame Component Tests
 *
 * Tests for the surface-cursor behavior that shows a cursor
 * where the raycast intersects a target surface.
 */

import {
  createMockAFRAME,
  createMockElement,
  createMockController,
} from './test-helpers';

import { registerSurfaceCursorComponent } from './surface-cursor';

describe('surface-cursor behavior', () => {
  let mockAFRAME: any;
  let componentDef: any;
  let component: any;
  let mockController: any;
  let mockCursor: any;
  let emittedEvents: Array<{ name: string; detail: any }>;

  beforeEach(() => {
    // Set up mock AFRAME
    mockAFRAME = createMockAFRAME();
    (window as any).AFRAME = mockAFRAME;

    // Register the component
    registerSurfaceCursorComponent();

    // Get the registered component definition
    componentDef = mockAFRAME.components['surface-cursor'];
    expect(componentDef).toBeDefined();

    // Create mock controller (the element this component attaches to)
    mockController = createMockElement('rightController', 0, 1, 0);

    // Create mock cursor element
    mockCursor = createMockElement('surface-cursor-visual', 0, 0, 0);
    mockCursor.object3D.visible = false;

    // Track emitted events
    emittedEvents = [];
    mockController.emit = (name: string, detail: any) => {
      emittedEvents.push({ name, detail });
    };

    // Mock raycaster component with no intersections initially
    mockController.components = {
      raycaster: {
        intersections: [],
      },
    };

    // Set up component instance
    component = {
      el: mockController,
      data: {
        enabled: true,
        targetClass: 'intersectable',
        cursorEl: mockCursor,
      },
      ...componentDef,
    };

    // Bind methods to component context
    Object.keys(componentDef).forEach((key) => {
      if (typeof componentDef[key] === 'function') {
        component[key] = componentDef[key].bind(component);
      }
    });

    // Initialize the component
    component.init();
  });

  afterEach(() => {
    delete (window as any).AFRAME;
  });

  describe('cursor visibility', () => {
    it('should show cursor when raycast intersects target surface', () => {
      // Set up intersection with target
      const mockIntersectedEl = createMockElement('garage');
      mockIntersectedEl.classList.add('intersectable');

      mockController.components.raycaster.intersections = [
        {
          point: { x: 1, y: 2, z: -3 },
          object: { el: mockIntersectedEl },
          face: { normal: { x: 0, y: 0, z: 1 } },
        },
      ];

      component.tick();

      expect(mockCursor.object3D.visible).toBe(true);
    });

    it('should hide cursor when no intersection', () => {
      // First show cursor
      const mockIntersectedEl = createMockElement('garage');
      mockIntersectedEl.classList.add('intersectable');
      mockController.components.raycaster.intersections = [
        {
          point: { x: 1, y: 2, z: -3 },
          object: { el: mockIntersectedEl },
          face: { normal: { x: 0, y: 0, z: 1 } },
        },
      ];
      component.tick();
      expect(mockCursor.object3D.visible).toBe(true);

      // Now clear intersections
      mockController.components.raycaster.intersections = [];
      component.tick();

      expect(mockCursor.object3D.visible).toBe(false);
    });
  });

  describe('cursor positioning', () => {
    it('should position cursor at intersection point', () => {
      const mockIntersectedEl = createMockElement('garage');
      mockIntersectedEl.classList.add('intersectable');

      mockController.components.raycaster.intersections = [
        {
          point: { x: 1.5, y: 2.5, z: -3.5 },
          object: { el: mockIntersectedEl },
          face: { normal: { x: 0, y: 0, z: 1 } },
        },
      ];

      component.tick();

      expect(mockCursor.object3D.position.x).toBe(1.5);
      expect(mockCursor.object3D.position.y).toBe(2.5);
      expect(mockCursor.object3D.position.z).toBe(-3.5);
    });
  });

  describe('interaction', () => {
    beforeEach(() => {
      // Set up valid intersection
      const mockIntersectedEl = createMockElement('garage');
      mockIntersectedEl.classList.add('intersectable');
      mockController.components.raycaster.intersections = [
        {
          point: { x: 1, y: 2, z: -3 },
          object: { el: mockIntersectedEl },
          face: { normal: { x: 0, y: 0, z: 1 } },
        },
      ];
      component.tick(); // Update intersection state
    });

    it('should emit surface-point-selected event when A button pressed', () => {
      component.onAButton();

      const event = emittedEvents.find((e) => e.name === 'surface-point-selected');
      expect(event).toBeDefined();
    });

    it('should include intersection point in event detail', () => {
      component.onAButton();

      const event = emittedEvents.find((e) => e.name === 'surface-point-selected');
      expect(event?.detail.point).toBeDefined();
      expect(event?.detail.point.x).toBe(1);
      expect(event?.detail.point.y).toBe(2);
      expect(event?.detail.point.z).toBe(-3);
    });

    it('should not emit when disabled', () => {
      component.data.enabled = false;

      component.onAButton();

      const event = emittedEvents.find((e) => e.name === 'surface-point-selected');
      expect(event).toBeUndefined();
    });

    it('should not emit when no intersection', () => {
      // Clear intersections
      mockController.components.raycaster.intersections = [];
      component.tick();

      component.onAButton();

      const event = emittedEvents.find((e) => e.name === 'surface-point-selected');
      expect(event).toBeUndefined();
    });
  });
});

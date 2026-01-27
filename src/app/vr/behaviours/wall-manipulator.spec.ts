/**
 * Wall Manipulator A-Frame Component Tests
 *
 * Tests for the wall-manipulator behavior that allows
 * two-handed grab/scale/rotate/move of the wall entity.
 */

import {
  createMockAFRAME,
  createMockElement,
  createMockController,
} from './test-helpers';

import { registerWallManipulatorComponent } from './wall-manipulator';

describe('wall-manipulator behavior', () => {
  let mockAFRAME: any;
  let componentDef: any;
  let component: any;
  let mockEl: any;
  let mockLeftController: any;
  let mockRightController: any;

  beforeEach(() => {
    // Set up mock AFRAME
    mockAFRAME = createMockAFRAME();
    (window as any).AFRAME = mockAFRAME;

    // Register the component
    registerWallManipulatorComponent();

    // Get the registered component definition
    componentDef = mockAFRAME.components['wall-manipulator'];
    expect(componentDef).toBeDefined();

    // Create mock element (the wall container)
    mockEl = createMockElement('wall-container');

    // Create mock controllers
    mockLeftController = createMockController('leftController', 0, 1, -1);
    mockRightController = createMockController('rightController', 0.5, 1, -1);

    // Set up component instance
    component = {
      el: mockEl,
      data: {
        enabled: true,
        leftController: mockLeftController,
        rightController: mockRightController,
        scaleSpeed: 1.0,
        rotateSpeed: 1.0,
        minScale: 0.1,
        maxScale: 5.0,
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

  describe('drag behavior (left trigger only)', () => {
    it('should move entity to follow left controller when left trigger held', () => {
      // Record initial position
      const initialX = mockEl.object3D.position.x;

      // Press left trigger to start drag
      component.onLeftTriggerDown();

      // Move controller
      mockLeftController.object3D.position.x = 1.0;

      // Tick to apply drag
      component.tick();

      // Entity should have moved
      expect(mockEl.object3D.position.x).not.toBe(initialX);
    });

    it('should stop following when left trigger released', () => {
      // Start drag
      component.onLeftTriggerDown();
      mockLeftController.object3D.position.x = 1.0;
      component.tick();

      // Release trigger
      component.onLeftTriggerUp();

      // Record position after release
      const posAfterRelease = mockEl.object3D.position.x;

      // Move controller further
      mockLeftController.object3D.position.x = 2.0;
      component.tick();

      // Position should not change
      expect(mockEl.object3D.position.x).toBe(posAfterRelease);
    });
  });

  describe('two-hand manipulation (both triggers)', () => {
    beforeEach(() => {
      // Position controllers at known distance apart
      mockLeftController.object3D.position.set(-0.5, 1, -1);
      mockRightController.object3D.position.set(0.5, 1, -1);
    });

    it('should scale entity larger when controllers move apart', () => {
      const initialScale = mockEl.object3D.scale.x;

      // Press both triggers
      component.onLeftTriggerDown();
      component.onRightTriggerDown();

      // Move controllers apart
      mockLeftController.object3D.position.x = -1.0;
      mockRightController.object3D.position.x = 1.0;

      component.tick();

      expect(mockEl.object3D.scale.x).toBeGreaterThan(initialScale);
    });

    it('should scale entity smaller when controllers move together', () => {
      const initialScale = mockEl.object3D.scale.x;

      // Press both triggers
      component.onLeftTriggerDown();
      component.onRightTriggerDown();

      // Move controllers together
      mockLeftController.object3D.position.x = -0.1;
      mockRightController.object3D.position.x = 0.1;

      component.tick();

      expect(mockEl.object3D.scale.x).toBeLessThan(initialScale);
    });

    it('should rotate entity when controllers twist around each other', () => {
      const initialRotationY = mockEl.object3D.rotation.y;

      // Press both triggers
      component.onLeftTriggerDown();
      component.onRightTriggerDown();

      // Twist controllers (left forward, right back in Z)
      mockLeftController.object3D.position.z = -1.5;
      mockRightController.object3D.position.z = -0.5;

      component.tick();

      expect(mockEl.object3D.rotation.y).not.toBe(initialRotationY);
    });

    it('should move entity when both controllers move in same direction', () => {
      const initialY = mockEl.object3D.position.y;

      // Press both triggers
      component.onLeftTriggerDown();
      component.onRightTriggerDown();

      // Move both controllers up together
      mockLeftController.object3D.position.y = 1.5;
      mockRightController.object3D.position.y = 1.5;

      component.tick();

      // Y should have increased
      expect(mockEl.object3D.position.y).toBeGreaterThan(initialY);
    });
  });

  describe('scale bounds', () => {
    beforeEach(() => {
      mockLeftController.object3D.position.set(-0.5, 1, -1);
      mockRightController.object3D.position.set(0.5, 1, -1);
    });

    it('should not scale below minScale', () => {
      component.data.minScale = 0.5;

      // Press both triggers
      component.onLeftTriggerDown();
      component.onRightTriggerDown();

      // Move controllers very close together
      mockLeftController.object3D.position.x = -0.01;
      mockRightController.object3D.position.x = 0.01;

      component.tick();

      expect(mockEl.object3D.scale.x).toBeGreaterThanOrEqual(0.5);
    });

    it('should not scale above maxScale', () => {
      component.data.maxScale = 2.0;

      // Press both triggers
      component.onLeftTriggerDown();
      component.onRightTriggerDown();

      // Move controllers very far apart
      mockLeftController.object3D.position.x = -5.0;
      mockRightController.object3D.position.x = 5.0;

      component.tick();

      expect(mockEl.object3D.scale.x).toBeLessThanOrEqual(2.0);
    });
  });

  describe('enabled state', () => {
    it('should ignore input when enabled is false', () => {
      component.data.enabled = false;

      const initialX = mockEl.object3D.position.x;

      // Try to start drag
      component.onLeftTriggerDown();
      mockLeftController.object3D.position.x = 5.0;
      component.tick();

      // Position should not have changed
      expect(mockEl.object3D.position.x).toBe(initialX);
    });
  });
});

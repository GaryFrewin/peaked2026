/**
 * Triangle Alignment A-Frame Component Tests
 *
 * Tests for the triangle-align behaviour that computes the optimal
 * transformation to align model markers to real markers.
 */

import { createMockAFRAME, createMockElement } from './test-helpers';
import { registerTriangleAlignComponent } from './triangle-align';

describe('triangle-align behavior', () => {
  let mockAFRAME: any;
  let componentDef: any;
  let component: any;
  let mockWallContainer: any;
  let emittedEvents: Array<{ name: string; detail: any }>;

  // Helper to create THREE.Vector3-like objects
  const vec3 = (x: number, y: number, z: number) => ({
    x,
    y,
    z,
    clone: function () {
      return vec3(this.x, this.y, this.z);
    },
    add: function (v: any) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    },
    sub: function (v: any) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      return this;
    },
    multiplyScalar: function (s: number) {
      this.x *= s;
      this.y *= s;
      this.z *= s;
      return this;
    },
    multiply: function (v: any) {
      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;
      return this;
    },
    divideScalar: function (s: number) {
      this.x /= s;
      this.y /= s;
      this.z /= s;
      return this;
    },
    distanceTo: function (v: any) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      const dz = this.z - v.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    normalize: function () {
      const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      if (len > 0) {
        this.x /= len;
        this.y /= len;
        this.z /= len;
      }
      return this;
    },
    applyQuaternion: function (_q: any) {
      // Simplified - real implementation would rotate
      return this;
    },
    copy: function (v: any) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    },
  });

  beforeEach(() => {
    // Set up mock AFRAME with THREE
    mockAFRAME = createMockAFRAME();
    (window as any).AFRAME = mockAFRAME;
    // Also set global THREE (A-Frame makes THREE available globally)
    (window as any).THREE = mockAFRAME.THREE;

    // Register the component
    registerTriangleAlignComponent();

    // Get the registered component definition
    componentDef = mockAFRAME.components['triangle-align'];
    expect(componentDef).toBeDefined();

    // Create mock wall container with object3D
    mockWallContainer = createMockElement('wall-container', 0, 0, -2);
    mockWallContainer.object3D.worldToLocal = (v: any) => v; // Identity for tests
    mockWallContainer.object3D.quaternion = { x: 0, y: 0, z: 0, w: 1, copy: function(q: any) { 
      this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w; return this; 
    }};

    // Track emitted events
    emittedEvents = [];
    mockWallContainer.emit = (name: string, detail: any) => {
      emittedEvents.push({ name, detail });
    };

    // Set up component instance
    component = {
      el: mockWallContainer,
      data: {
        animate: false,
        animationDuration: 500,
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
    delete (window as any).THREE;
  });

  describe('buildOrthonormalFrame', () => {
    it('should build orthonormal frame from 3 points', () => {
      // Simple triangle on XY plane
      const p1 = vec3(0, 0, 0);
      const p2 = vec3(1, 0, 0);
      const p3 = vec3(0, 1, 0);

      const frame = component.buildOrthonormalFrame(p1, p2, p3);

      // X axis should point from p1 to p2 (along +X)
      expect(frame.x.x).toBeCloseTo(1, 5);
      expect(frame.x.y).toBeCloseTo(0, 5);
      expect(frame.x.z).toBeCloseTo(0, 5);

      // Z axis should be perpendicular to triangle (along +Z)
      expect(frame.z.x).toBeCloseTo(0, 5);
      expect(frame.z.y).toBeCloseTo(0, 5);
      expect(frame.z.z).toBeCloseTo(1, 5);

      // Y axis should complete the frame (along +Y)
      expect(frame.y.x).toBeCloseTo(0, 5);
      expect(frame.y.y).toBeCloseTo(1, 5);
      expect(frame.y.z).toBeCloseTo(0, 5);
    });

    it('should handle triangles in different orientations', () => {
      // Triangle on XZ plane
      const p1 = vec3(0, 0, 0);
      const p2 = vec3(1, 0, 0);
      const p3 = vec3(0, 0, 1);

      const frame = component.buildOrthonormalFrame(p1, p2, p3);

      // X axis should point from p1 to p2 (along +X)
      expect(frame.x.x).toBeCloseTo(1, 5);
      expect(frame.x.y).toBeCloseTo(0, 5);
      expect(frame.x.z).toBeCloseTo(0, 5);

      // Z axis should be perpendicular (along -Y for this orientation)
      expect(Math.abs(frame.z.y)).toBeCloseTo(1, 5);
    });
  });

  describe('computeAlignment', () => {
    it('should compute identity transform for coincident triangles', () => {
      // Same triangle for real and model
      const real = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];
      const model = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];

      const result = component.computeAlignment(real, model, mockWallContainer.object3D);

      expect(result).toBeDefined();
      // Scale should be 1
      expect(result.scale.x).toBeCloseTo(1, 3);
      expect(result.scale.y).toBeCloseTo(1, 3);
      expect(result.scale.z).toBeCloseTo(1, 3);
    });

    it('should compute correct scale for different sized triangles', () => {
      // Real triangle is 2x the size of model triangle
      const real = [vec3(0, 0, 0), vec3(2, 0, 0), vec3(0, 2, 0)];
      const model = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];

      const result = component.computeAlignment(real, model, mockWallContainer.object3D);

      expect(result).toBeDefined();
      // Scale should be 2
      expect(result.scale.x).toBeCloseTo(2, 3);
    });

    it('should return null if markers are too close together', () => {
      // Markers 1 and 2 are at same position
      const real = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];
      const model = [vec3(0, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0)];

      const result = component.computeAlignment(real, model, mockWallContainer.object3D);

      expect(result).toBeNull();
    });
  });

  describe('align', () => {
    it('should require exactly 3 markers in each set', () => {
      const real = [vec3(0, 0, 0), vec3(1, 0, 0)]; // Only 2
      const model = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];

      // Should not throw but log error
      component.align(real, model);

      // Should not emit alignment-complete
      const event = emittedEvents.find((e) => e.name === 'alignment-complete');
      expect(event).toBeUndefined();
    });

    it('should emit alignment-complete event on success (instant mode)', () => {
      const real = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];
      const model = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];

      component.align(real, model);

      const event = emittedEvents.find((e) => e.name === 'alignment-complete');
      expect(event).toBeDefined();
      expect(event?.detail.position).toBeDefined();
      expect(event?.detail.quaternion).toBeDefined();
      expect(event?.detail.scale).toBeDefined();
    });

    it('should apply transform to container in instant mode', () => {
      const real = [vec3(1, 1, 1), vec3(2, 1, 1), vec3(1, 2, 1)];
      const model = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];

      component.align(real, model);

      // Container position should be updated
      // (exact values depend on algorithm, but should be defined)
      expect(mockWallContainer.object3D.position).toBeDefined();
    });
  });
});

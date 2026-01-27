/**
 * Test Helpers for A-Frame Behaviour Tests
 *
 * Provides mock AFRAME, elements, controllers, and utilities
 * for testing A-Frame components without a real browser/WebXR.
 */

/**
 * Creates a mock THREE.Vector3-like object
 */
export function createMockVector3(x = 0, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    set(newX: number, newY: number, newZ: number) {
      this.x = newX;
      this.y = newY;
      this.z = newZ;
      return this;
    },
    copy(v: any) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    },
    add(v: any) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    },
    sub(v: any) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      return this;
    },
    addVectors(a: any, b: any) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;
      return this;
    },
    subVectors(a: any, b: any) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    },
    multiplyScalar(s: number) {
      this.x *= s;
      this.y *= s;
      this.z *= s;
      return this;
    },
    distanceTo(v: any) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      const dz = this.z - v.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    clone() {
      return createMockVector3(this.x, this.y, this.z);
    },
  };
}

/**
 * Creates a mock THREE.Euler-like object for rotation
 */
export function createMockEuler(x = 0, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    set(newX: number, newY: number, newZ: number) {
      this.x = newX;
      this.y = newY;
      this.z = newZ;
      return this;
    },
  };
}

/**
 * Creates a mock Object3D with position, rotation, scale
 */
export function createMockObject3D(x = 0, y = 0, z = 0) {
  const position = createMockVector3(x, y, z);
  return {
    position,
    rotation: createMockEuler(0, 0, 0),
    scale: createMockVector3(1, 1, 1),
    visible: true,
    getWorldPosition(target: any) {
      target.copy(position);
      return target;
    },
    lookAt(_x: number, _y: number, _z: number) {
      // Mock lookAt - just tracks that it was called
    },
  };
}

/**
 * Creates a mock A-Frame element
 */
export function createMockElement(id: string, x = 0, y = 0, z = 0) {
  const object3D = createMockObject3D(x, y, z);
  const listeners: Record<string, Function[]> = {};
  const attributes: Record<string, any> = {};
  const classes = new Set<string>();

  return {
    id,
    object3D,
    classList: {
      add(className: string) {
        classes.add(className);
      },
      remove(className: string) {
        classes.delete(className);
      },
      contains(className: string) {
        return classes.has(className);
      },
      toggle(className: string) {
        if (classes.has(className)) {
          classes.delete(className);
        } else {
          classes.add(className);
        }
      },
    },
    getAttribute(name: string) {
      return attributes[name] ?? null;
    },
    setAttribute(name: string, value: any) {
      attributes[name] = value;
    },
    addEventListener(event: string, handler: Function) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    removeEventListener(event: string, handler: Function) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    },
    emit(event: string, detail?: any) {
      if (listeners[event]) {
        listeners[event].forEach((h) => h({ detail }));
      }
    },
    sceneEl: {
      querySelector(_selector: string) {
        return null;
      },
    },
  };
}

/**
 * Creates a mock VR controller element
 */
export function createMockController(id: string, x = 0, y = 1, z = -1) {
  const controller = createMockElement(id, x, y, z);
  return controller;
}

/**
 * Creates a mock AFRAME global with component registration
 */
export function createMockAFRAME() {
  const components: Record<string, any> = {};

  const THREE = {
    Vector3: class {
      x: number;
      y: number;
      z: number;
      constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
      set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
      }
      copy(v: any) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
      }
      add(v: any) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
      }
      sub(v: any) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
      }
      addVectors(a: any, b: any) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this;
      }
      subVectors(a: any, b: any) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
      }
      multiplyScalar(s: number) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
      }
      distanceTo(v: any) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
      clone() {
        return new THREE.Vector3(this.x, this.y, this.z);
      }
    },
  };

  return {
    components,
    THREE,
    registerComponent(name: string, definition: any) {
      components[name] = definition;
    },
  };
}

/**
 * Simulate a tick call on a component
 */
export function simulateTick(component: any, deltaTime = 16) {
  if (component.tick) {
    component.tick(deltaTime, deltaTime);
  }
}

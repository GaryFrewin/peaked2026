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
 * Creates a mock A-Frame element for testing
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

  // Mock THREE.Vector3 class with full implementation needed for triangle-align
  class MockVector3 {
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
    multiply(v: any) {
      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;
      return this;
    }
    divideScalar(s: number) {
      this.x /= s;
      this.y /= s;
      this.z /= s;
      return this;
    }
    crossVectors(a: any, b: any) {
      const ax = a.x,
        ay = a.y,
        az = a.z;
      const bx = b.x,
        by = b.y,
        bz = b.z;
      this.x = ay * bz - az * by;
      this.y = az * bx - ax * bz;
      this.z = ax * by - ay * bx;
      return this;
    }
    normalize() {
      const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      if (len > 0) {
        this.x /= len;
        this.y /= len;
        this.z /= len;
      }
      return this;
    }
    applyQuaternion(q: any) {
      // Quaternion-vector multiplication: v' = q * v * q^-1
      const x = this.x,
        y = this.y,
        z = this.z;
      const qx = q.x,
        qy = q.y,
        qz = q.z,
        qw = q.w;

      // Calculate quat * vector
      const ix = qw * x + qy * z - qz * y;
      const iy = qw * y + qz * x - qx * z;
      const iz = qw * z + qx * y - qy * x;
      const iw = -qx * x - qy * y - qz * z;

      // Calculate result * inverse quat
      this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
      this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
      this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

      return this;
    }
    distanceTo(v: any) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      const dz = this.z - v.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    lerpVectors(v1: any, v2: any, alpha: number) {
      this.x = v1.x + (v2.x - v1.x) * alpha;
      this.y = v1.y + (v2.y - v1.y) * alpha;
      this.z = v1.z + (v2.z - v1.z) * alpha;
      return this;
    }
    clone() {
      return new MockVector3(this.x, this.y, this.z);
    }
  }

  // Mock THREE.Quaternion class
  class MockQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    set(x: number, y: number, z: number, w: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    }
    copy(q: any) {
      this.x = q.x;
      this.y = q.y;
      this.z = q.z;
      this.w = q.w;
      return this;
    }
    setFromRotationMatrix(m: any) {
      // Simplified extraction from rotation matrix
      const te = m.elements;
      const m11 = te[0],
        m12 = te[4],
        m13 = te[8];
      const m21 = te[1],
        m22 = te[5],
        m23 = te[9];
      const m31 = te[2],
        m32 = te[6],
        m33 = te[10];
      const trace = m11 + m22 + m33;

      if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1.0);
        this.w = 0.25 / s;
        this.x = (m32 - m23) * s;
        this.y = (m13 - m31) * s;
        this.z = (m21 - m12) * s;
      } else if (m11 > m22 && m11 > m33) {
        const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
        this.w = (m32 - m23) / s;
        this.x = 0.25 * s;
        this.y = (m12 + m21) / s;
        this.z = (m13 + m31) / s;
      } else if (m22 > m33) {
        const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
        this.w = (m13 - m31) / s;
        this.x = (m12 + m21) / s;
        this.y = 0.25 * s;
        this.z = (m23 + m32) / s;
      } else {
        const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
        this.w = (m21 - m12) / s;
        this.x = (m13 + m31) / s;
        this.y = (m23 + m32) / s;
        this.z = 0.25 * s;
      }
      return this;
    }
    slerpQuaternions(qa: any, qb: any, t: number) {
      // Simplified SLERP - just linear interpolation for tests
      this.x = qa.x + (qb.x - qa.x) * t;
      this.y = qa.y + (qb.y - qa.y) * t;
      this.z = qa.z + (qb.z - qa.z) * t;
      this.w = qa.w + (qb.w - qa.w) * t;
      // Normalize
      const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
      if (len > 0) {
        this.x /= len;
        this.y /= len;
        this.z /= len;
        this.w /= len;
      }
      return this;
    }
    clone() {
      return new MockQuaternion(this.x, this.y, this.z, this.w);
    }
  }

  // Mock THREE.Matrix4 class
  class MockMatrix4 {
    elements: number[];
    constructor() {
      // Identity matrix
      this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
    makeBasis(xAxis: any, yAxis: any, zAxis: any) {
      // Set columns from axis vectors
      this.elements[0] = xAxis.x;
      this.elements[1] = xAxis.y;
      this.elements[2] = xAxis.z;
      this.elements[3] = 0;
      this.elements[4] = yAxis.x;
      this.elements[5] = yAxis.y;
      this.elements[6] = yAxis.z;
      this.elements[7] = 0;
      this.elements[8] = zAxis.x;
      this.elements[9] = zAxis.y;
      this.elements[10] = zAxis.z;
      this.elements[11] = 0;
      this.elements[12] = 0;
      this.elements[13] = 0;
      this.elements[14] = 0;
      this.elements[15] = 1;
      return this;
    }
    invert() {
      // For rotation matrices, inverse = transpose
      const te = this.elements;
      const tmp = te[1];
      te[1] = te[4];
      te[4] = tmp;
      const tmp2 = te[2];
      te[2] = te[8];
      te[8] = tmp2;
      const tmp3 = te[6];
      te[6] = te[9];
      te[9] = tmp3;
      return this;
    }
    multiplyMatrices(a: any, b: any) {
      const ae = a.elements;
      const be = b.elements;
      const te = this.elements;

      const a11 = ae[0],
        a12 = ae[4],
        a13 = ae[8],
        a14 = ae[12];
      const a21 = ae[1],
        a22 = ae[5],
        a23 = ae[9],
        a24 = ae[13];
      const a31 = ae[2],
        a32 = ae[6],
        a33 = ae[10],
        a34 = ae[14];
      const a41 = ae[3],
        a42 = ae[7],
        a43 = ae[11],
        a44 = ae[15];

      const b11 = be[0],
        b12 = be[4],
        b13 = be[8],
        b14 = be[12];
      const b21 = be[1],
        b22 = be[5],
        b23 = be[9],
        b24 = be[13];
      const b31 = be[2],
        b32 = be[6],
        b33 = be[10],
        b34 = be[14];
      const b41 = be[3],
        b42 = be[7],
        b43 = be[11],
        b44 = be[15];

      te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
      te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
      te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
      te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

      te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
      te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
      te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
      te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

      te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
      te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
      te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
      te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

      te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
      te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
      te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
      te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

      return this;
    }
    clone() {
      const m = new MockMatrix4();
      m.elements = [...this.elements];
      return m;
    }
  }

  const THREE = {
    Vector3: MockVector3,
    Quaternion: MockQuaternion,
    Matrix4: MockMatrix4,
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

/**
 * Set up a test A-Frame scene in the DOM
 * Returns the scene element
 */
export function setupTestScene(): HTMLElement {
  // Remove any existing scene
  const existing = document.querySelector('a-scene');
  if (existing) {
    existing.remove();
  }

  // Create scene
  const scene = document.createElement('a-scene');
  scene.setAttribute('embedded', '');
  scene.setAttribute('vr-mode-ui', 'enabled: false');
  document.body.appendChild(scene);

  return scene;
}

/**
 * Clean up test scene from DOM
 */
export function teardownTestScene(scene: HTMLElement): void {
  if (scene && scene.parentNode) {
    scene.parentNode.removeChild(scene);
  }
}

/**
 * Wait for A-Frame scene to be loaded
 */
export function waitForSceneLoad(scene: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    if ((scene as any).hasLoaded) {
      resolve();
      return;
    }

    scene.addEventListener('loaded', () => resolve(), { once: true });

    // Fallback timeout - if scene doesn't fire loaded, resolve anyway after short delay
    setTimeout(() => resolve(), 200);
  });
}

/**
 * Test-only helpers for calibrated-anchor component testing.
 * These are jasmine-dependent and should NOT be in production builds.
 */

/**
 * Creates a mock A-Frame scene element for anchor testing.
 * Uses jasmine spies - only for use in .spec.ts files.
 */
export function createMockScene() {
  const listeners: Record<string, Function[]> = {};
  const attributes: Record<string, any> = {
    webxr: { optionalFeatures: ['local-floor'] },
  };
  const modes = new Set<string>();

  const mockXrManager = {
    getSession: jasmine.createSpy('getSession').and.returnValue(null),
    getReferenceSpace: jasmine.createSpy('getReferenceSpace').and.returnValue({}),
  };

  return {
    renderer: {
      xr: mockXrManager,
    },
    frame: null as any,
    is: jasmine.createSpy('is').and.callFake((mode: string) => modes.has(mode)),
    enterMode(mode: string) {
      modes.add(mode);
    },
    exitMode(mode: string) {
      modes.delete(mode);
    },
    getAttribute: jasmine.createSpy('getAttribute').and.callFake((name: string) => attributes[name]),
    setAttribute: jasmine.createSpy('setAttribute').and.callFake((name: string, value: any) => {
      attributes[name] = value;
    }),
    addEventListener: jasmine.createSpy('addEventListener').and.callFake((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: jasmine.createSpy('removeEventListener').and.callFake((event: string, handler: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    emit(event: string, detail?: any) {
      if (listeners[event]) {
        listeners[event].forEach((h) => h({ detail }));
      }
    },
    object3D: {
      attach: jasmine.createSpy('attach'),
      add: jasmine.createSpy('add'),
    },
  };
}

/**
 * Creates a mock A-Frame element for anchor component testing.
 * Uses jasmine spies - only for use in .spec.ts files.
 */
export function createMockElementWithScene(scene: any, x = 0, y = 0, z = 0): any {
  const listeners: Record<string, Function[]> = {};
  const attributes: Record<string, any> = {};
  const classes = new Set<string>();

  // Create position/scale objects with jasmine spies
  const position = {
    x,
    y,
    z,
    set: jasmine.createSpy('position.set').and.callFake(function (this: any, px: number, py: number, pz: number) {
      this.x = px;
      this.y = py;
      this.z = pz;
    }),
    copy: jasmine.createSpy('position.copy').and.callFake(function (this: any, source: any) {
      this.x = source.x;
      this.y = source.y;
      this.z = source.z;
    }),
  };

  const rotation = {
    x: 0,
    y: 0,
    z: 0,
  };

  const scale = {
    x: 1,
    y: 1,
    z: 1,
    set: jasmine.createSpy('scale.set').and.callFake(function (this: any, sx: number, sy: number, sz: number) {
      this.x = sx;
      this.y = sy;
      this.z = sz;
    }),
  };

  const matrix = {
    elements: new Array(16).fill(0),
    decompose: jasmine.createSpy('decompose').and.callFake((pos: any, _rot: any, scl: any) => {
      pos.copy(position);
      scl.x = scale.x;
      scl.y = scale.y;
      scl.z = scale.z;
    }),
  };

  const object3D = {
    position,
    rotation,
    scale,
    matrix,
    visible: true,
    getWorldPosition(target: any) {
      target.copy(position);
      return target;
    },
    lookAt(_x: number, _y: number, _z: number) {
      // Mock lookAt
    },
  };

  return {
    id: 'mock-element',
    object3D,
    sceneEl: scene,
    components: {} as Record<string, any>,
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
  };
}

/**
 * Desktop Interaction Manager - Tests
 *
 * Tests for capturing mouse events on interactable elements
 * and logging them with relevant data.
 * 
 * These tests use a mock AFRAME since the real A-Frame isn't available in unit tests.
 */

import {
  registerDesktopInteractionManager,
  unregisterDesktopInteractionManager,
} from './desktop-interaction-manager';
import { createMockAFRAME } from './test-helpers';

describe('desktop-interaction-manager', () => {
  let mockAFRAME: any;
  let consoleSpy: jasmine.Spy;
  let componentDefinition: any;

  beforeEach(() => {
    // Set up mock AFRAME on window
    mockAFRAME = createMockAFRAME();
    (window as any).AFRAME = mockAFRAME;
    
    consoleSpy = spyOn(console, 'log').and.callThrough();
    spyOn(console, 'warn').and.callThrough();
    
    // Register the component
    registerDesktopInteractionManager();
    componentDefinition = mockAFRAME.components['desktop-interaction-manager'];
  });

  afterEach(() => {
    unregisterDesktopInteractionManager();
    delete (window as any).AFRAME;
  });

  describe('registration', () => {
    it('should register the component with AFRAME', () => {
      expect(componentDefinition).toBeDefined();
    });

    it('should have init method', () => {
      expect(componentDefinition.init).toBeDefined();
      expect(typeof componentDefinition.init).toBe('function');
    });

    it('should have remove method for cleanup', () => {
      expect(componentDefinition.remove).toBeDefined();
      expect(typeof componentDefinition.remove).toBe('function');
    });
  });

  describe('component behavior', () => {
    let mockElement: any;
    let componentInstance: any;
    let eventListeners: Map<string, Function>;

    beforeEach(() => {
      eventListeners = new Map();
      
      // Create mock element that tracks event listeners
      mockElement = {
        addEventListener: jasmine.createSpy('addEventListener').and.callFake(
          (event: string, handler: Function) => {
            eventListeners.set(event, handler);
          }
        ),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };

      // Create component instance with bound context
      componentInstance = {
        el: mockElement,
        data: { debug: true },
        ...componentDefinition,
      };

      // Bind all methods to the instance
      Object.keys(componentDefinition).forEach(key => {
        if (typeof componentDefinition[key] === 'function') {
          componentInstance[key] = componentDefinition[key].bind(componentInstance);
        }
      });

      // Initialize the component
      componentInstance.init();
    });

    it('should log initialization message', () => {
      expect(consoleSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/\[desktop-interaction-manager\].*[Ii]nitializ/)
      );
    });

    it('should register pointerdown event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'pointerdown',
        jasmine.any(Function)
      );
    });
    it('should register pointerup event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'pointerup',
        jasmine.any(Function)
      );
    });

    it('should register mouseenter event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'mouseenter',
        jasmine.any(Function)
      );
    });

    it('should register mouseleave event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'mouseleave',
        jasmine.any(Function)
      );
    });

    describe('hold click handling', () => {
      it('should log holdClicked when a hold is clicked (pointerdown/up, no drag)', () => {
        const pointerDownHandler = eventListeners.get('pointerdown')!;
        const pointerUpHandler = eventListeners.get('pointerup')!;
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
        };
        const pointerDownEvent = { target: mockHoldElement, clientX: 100, clientY: 100 };
        const pointerUpEvent = { target: mockHoldElement, clientX: 100, clientY: 100, detail: { intersection: { point: { x: 1, y: 2, z: 3 } } } };
        consoleSpy.calls.reset();
        pointerDownHandler(pointerDownEvent);
        pointerUpHandler(pointerUpEvent);
        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdClicked',
          jasmine.objectContaining({ holdId: 42 })
        );
      });
      it('should NOT log holdClicked if pointer moves more than threshold (drag)', () => {
        const pointerDownHandler = eventListeners.get('pointerdown')!;
        const pointerUpHandler = eventListeners.get('pointerup')!;
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
        };
        const pointerDownEvent = { target: mockHoldElement, clientX: 100, clientY: 100 };
        const pointerUpEvent = { target: mockHoldElement, clientX: 120, clientY: 120, detail: { intersection: { point: { x: 1, y: 2, z: 3 } } } };
        consoleSpy.calls.reset();
        pointerDownHandler(pointerDownEvent);
        pointerUpHandler(pointerUpEvent);
        const interactionCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('holdClicked')
        );
        expect(interactionCalls.length).toBe(0);
      });
      it('should extract intersection point from click event', () => {
        const pointerDownHandler = eventListeners.get('pointerdown')!;
        const pointerUpHandler = eventListeners.get('pointerup')!;
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '99' : null,
        };
        const pointerDownEvent = { target: mockHoldElement, clientX: 50, clientY: 50 };
        const pointerUpEvent = { target: mockHoldElement, clientX: 50, clientY: 50, detail: { intersection: { point: { x: 5.5, y: 3.2, z: 1.1 } } } };
        consoleSpy.calls.reset();
        pointerDownHandler(pointerDownEvent);
        pointerUpHandler(pointerUpEvent);
        const logCall = consoleSpy.calls.mostRecent();
        expect(logCall.args[1].intersection).toEqual({ x: 5.5, y: 3.2, z: 1.1 });
      });
    });

    describe('hold hover handling', () => {
      it('should log holdHovered on mouseenter', () => {
        const enterHandler = eventListeners.get('mouseenter')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '77' : null,
        };

        consoleSpy.calls.reset();
        enterHandler({ target: mockHoldElement });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdHovered',
          jasmine.objectContaining({ holdId: 77 })
        );
      });

      it('should log holdUnhovered on mouseleave', () => {
        const leaveHandler = eventListeners.get('mouseleave')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '77' : null,
        };

        consoleSpy.calls.reset();
        leaveHandler({ target: mockHoldElement });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdUnhovered',
          jasmine.objectContaining({ holdId: 77 })
        );
      });
    });

    describe('wall click handling', () => {
      it('should log wallClicked with intersection point (pointerdown/up, no drag)', () => {
        const pointerDownHandler = eventListeners.get('pointerdown')!;
        const pointerUpHandler = eventListeners.get('pointerup')!;
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };
        const pointerDownEvent = { target: mockWallElement, clientX: 10, clientY: 10 };
        const pointerUpEvent = { target: mockWallElement, clientX: 10, clientY: 10, detail: { intersection: { point: { x: 0.5, y: 1.2, z: 0.1 } } } };
        consoleSpy.calls.reset();
        pointerDownHandler(pointerDownEvent);
        pointerUpHandler(pointerUpEvent);
        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] wallClicked',
          jasmine.objectContaining({
            point: { x: 0.5, y: 1.2, z: 0.1 },
            entityId: 'garage',
          })
        );
      });
      it('should handle wall click without intersection point (pointerdown/up, no drag)', () => {
        const pointerDownHandler = eventListeners.get('pointerdown')!;
        const pointerUpHandler = eventListeners.get('pointerup')!;
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };
        const pointerDownEvent = { target: mockWallElement, clientX: 10, clientY: 10 };
        const pointerUpEvent = { target: mockWallElement, clientX: 10, clientY: 10, detail: {} };
        consoleSpy.calls.reset();
        pointerDownHandler(pointerDownEvent);
        pointerUpHandler(pointerUpEvent);
        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] wallClicked (no intersection point)',
          jasmine.objectContaining({ point: null })
        );
      });
      it('should NOT log wallClicked if pointer moves more than threshold (drag)', () => {
        const pointerDownHandler = eventListeners.get('pointerdown')!;
        const pointerUpHandler = eventListeners.get('pointerup')!;
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };
        const pointerDownEvent = { target: mockWallElement, clientX: 10, clientY: 10 };
        const pointerUpEvent = { target: mockWallElement, clientX: 30, clientY: 30, detail: { intersection: { point: { x: 0.5, y: 1.2, z: 0.1 } } } };
        consoleSpy.calls.reset();
        pointerDownHandler(pointerDownEvent);
        pointerUpHandler(pointerUpEvent);
        const interactionCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('wallClicked')
        );
        expect(interactionCalls.length).toBe(0);
      });
    });

    describe('event filtering', () => {
      it('should ignore pointer events on elements without recognized classes', () => {
        const pointerDownHandler = eventListeners.get('pointerdown')!;
        const pointerUpHandler = eventListeners.get('pointerup')!;
        const mockRandomElement = {
          classList: { contains: () => false },
          getAttribute: () => null,
        };
        consoleSpy.calls.reset();
        pointerDownHandler({ target: mockRandomElement, clientX: 0, clientY: 0 });
        pointerUpHandler({ target: mockRandomElement, clientX: 0, clientY: 0 });
        // Should not log holdClicked or wallClicked
        const interactionCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('holdClicked') || 
                  call.args[0]?.includes?.('wallClicked')
        );
        expect(interactionCalls.length).toBe(0);
      });
    });

    describe('cleanup', () => {
      it('should remove event listeners on remove', () => {
        componentInstance.remove();
        expect(mockElement.removeEventListener).toHaveBeenCalledWith(
          'pointerdown',
          jasmine.any(Function)
        );
        expect(mockElement.removeEventListener).toHaveBeenCalledWith(
          'pointerup',
          jasmine.any(Function)
        );
        expect(mockElement.removeEventListener).toHaveBeenCalledWith(
          'mouseenter',
          jasmine.any(Function)
        );
        expect(mockElement.removeEventListener).toHaveBeenCalledWith(
          'mouseleave',
          jasmine.any(Function)
        );
      });
    });
  });
});

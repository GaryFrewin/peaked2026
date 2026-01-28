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

    it('should register click event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'click',
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
      it('should log holdClicked when a hold is clicked', () => {
        const clickHandler = eventListeners.get('click')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
        };

        const mockEvent = {
          target: mockHoldElement,
          detail: { intersection: { point: { x: 1, y: 2, z: 3 } } },
        };

        consoleSpy.calls.reset();
        clickHandler(mockEvent);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdClicked',
          jasmine.objectContaining({ holdId: 42 })
        );
      });

      it('should extract intersection point from click event', () => {
        const clickHandler = eventListeners.get('click')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '99' : null,
        };

        const mockEvent = {
          target: mockHoldElement,
          detail: { intersection: { point: { x: 5.5, y: 3.2, z: 1.1 } } },
        };

        consoleSpy.calls.reset();
        clickHandler(mockEvent);

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
      it('should log wallClicked with intersection point', () => {
        const clickHandler = eventListeners.get('click')!;
        
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };

        const mockEvent = {
          target: mockWallElement,
          detail: { intersection: { point: { x: 0.5, y: 1.2, z: 0.1 } } },
        };

        consoleSpy.calls.reset();
        clickHandler(mockEvent);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] wallClicked',
          jasmine.objectContaining({
            point: { x: 0.5, y: 1.2, z: 0.1 },
            entityId: 'garage',
          })
        );
      });

      it('should handle wall click without intersection point', () => {
        const clickHandler = eventListeners.get('click')!;
        
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };

        const mockEvent = {
          target: mockWallElement,
          detail: {},
        };

        consoleSpy.calls.reset();
        clickHandler(mockEvent);

        // Should still log but with null point
        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] wallClicked (no intersection point)',
          jasmine.objectContaining({ point: null })
        );
      });
    });

    describe('event filtering', () => {
      it('should ignore clicks on elements without recognized classes', () => {
        const clickHandler = eventListeners.get('click')!;
        
        const mockRandomElement = {
          classList: { contains: () => false },
          getAttribute: () => null,
        };

        consoleSpy.calls.reset();
        clickHandler({ target: mockRandomElement });

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
          'click',
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

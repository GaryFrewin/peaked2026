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

    it('should register mousedown event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'mousedown',
        jasmine.any(Function)
      );
    });

    it('should register mouseup event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'mouseup',
        jasmine.any(Function)
      );
    });

    it('should register mousemove event listener', () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'mousemove',
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
      let mockPeakedBus: any;

      beforeEach(() => {
        // Mock the peakedBus
        mockPeakedBus = {
          emitHoldClicked: jasmine.createSpy('emitHoldClicked'),
          emitHoldDragStarted: jasmine.createSpy('emitHoldDragStarted'),
          emitHoldDragUpdated: jasmine.createSpy('emitHoldDragUpdated'),
          emitHoldDragEnded: jasmine.createSpy('emitHoldDragEnded'),
          emitHoldHovered: jasmine.createSpy('emitHoldHovered'),
          emitHoldUnhovered: jasmine.createSpy('emitHoldUnhovered'),
        };
        (window as any).peakedBus = mockPeakedBus;
      });

      afterEach(() => {
        delete (window as any).peakedBus;
      });

      it('should log holdClicked when a hold is clicked (mousedown/up, no drag)', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };
        const mouseUpEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0, point: { x: 1, y: 2, z: 3 } } } 
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdClicked',
          jasmine.objectContaining({ holdId: 42 })
        );
        expect(mockPeakedBus.emitHoldClicked).toHaveBeenCalledWith(42);
      });

      it('should NOT log holdClicked if intersection distance changes (drag)', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };
        const mouseUpEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.5, point: { x: 1, y: 2, z: 3 } } } 
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

        const interactionCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('holdClicked')
        );
        expect(interactionCalls.length).toBe(0);
        expect(mockPeakedBus.emitHoldClicked).not.toHaveBeenCalled();
      });

      it('should extract intersection point from click event', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => {
            if (attr === 'data-hold-id') return '99';
            if (attr === 'position') return { x: 1, y: 2, z: 3 };
            return null;
          },
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 3.0 } }
        };
        const mouseUpEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 3.0, point: { x: 5.5, y: 3.2, z: 1.1 } } } 
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

        const logCall = consoleSpy.calls.all().find(
          call => call.args[0]?.includes?.('holdClicked')
        );
        expect(logCall?.args[1].intersection).toEqual({ x: 5.5, y: 3.2, z: 1.1 });
      });

      it('should NOT create hold when dragging from hold to wall (different targets)', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };

        // Mouse down on hold
        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };

        // Mouse up on wall with different distance (drag detected)
        const mouseUpEvent = { 
          target: mockWallElement,
          detail: { intersection: { distance: 6.5, point: { x: 1, y: 2, z: 3 } } } 
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

        // Should NOT emit hold clicked or wall clicked
        expect(mockPeakedBus.emitHoldClicked).not.toHaveBeenCalled();
        
        const holdClickCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('holdClicked')
        );
        const wallClickCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('wallClicked')
        );
        
        expect(holdClickCalls.length).toBe(0);
        expect(wallClickCalls.length).toBe(0);
      });
    });

    describe('hold double-click handling', () => {
      let mockPeakedBus: any;
      let mockDateNow: jasmine.Spy;
      let currentTime: number;

      beforeEach(() => {
        mockPeakedBus = {
          emitHoldClicked: jasmine.createSpy('emitHoldClicked'),
          emitHoldDoubleClicked: jasmine.createSpy('emitHoldDoubleClicked'),
        };
        (window as any).peakedBus = mockPeakedBus;
        
        // Mock Date.now() to control time
        currentTime = 1000000; // Start at some arbitrary time
        mockDateNow = spyOn(Date, 'now').and.callFake(() => currentTime);
      });

      afterEach(() => {
        delete (window as any).peakedBus;
      });

      it('should emit holdDoubleClicked when same hold is clicked twice within 300ms', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const createClickEvents = () => ({
          down: { 
            target: mockHoldElement,
            detail: { intersection: { distance: 5.0 } }
          },
          up: { 
            target: mockHoldElement,
            detail: { intersection: { distance: 5.0, point: { x: 1, y: 2, z: 3 } } } 
          }
        });

        // First click at time 1000000
        const click1 = createClickEvents();
        mouseDownHandler(click1.down);
        mouseUpHandler(click1.up);
        
        expect(mockPeakedBus.emitHoldClicked).toHaveBeenCalledWith(42);
        expect(mockPeakedBus.emitHoldDoubleClicked).not.toHaveBeenCalled();
        
        // Advance time by 200ms
        currentTime += 200;
        
        // Second click within 300ms threshold
        const click2 = createClickEvents();
        mouseDownHandler(click2.down);
        mouseUpHandler(click2.up);
        
        expect(mockPeakedBus.emitHoldDoubleClicked).toHaveBeenCalledWith(42);
        expect(mockPeakedBus.emitHoldClicked).toHaveBeenCalledTimes(2);
      });

      it('should NOT emit holdDoubleClicked when clicks are more than 300ms apart', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const createClickEvents = () => ({
          down: { 
            target: mockHoldElement,
            detail: { intersection: { distance: 5.0 } }
          },
          up: { 
            target: mockHoldElement,
            detail: { intersection: { distance: 5.0, point: { x: 1, y: 2, z: 3 } } } 
          }
        });

        // First click at time 1000000
        const click1 = createClickEvents();
        mouseDownHandler(click1.down);
        mouseUpHandler(click1.up);
        
        // Advance time by 400ms (beyond threshold)
        currentTime += 400;
        
        // Second click after threshold
        const click2 = createClickEvents();
        mouseDownHandler(click2.down);
        mouseUpHandler(click2.up);
        
        expect(mockPeakedBus.emitHoldDoubleClicked).not.toHaveBeenCalled();
        expect(mockPeakedBus.emitHoldClicked).toHaveBeenCalledTimes(2);
      });

      it('should NOT emit holdDoubleClicked when clicking two different holds', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement1 = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement1 : null,
        };

        const mockHoldElement2 = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '99' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement2 : null,
        };

        // Click first hold at time 1000000
        mouseDownHandler({ 
          target: mockHoldElement1,
          detail: { intersection: { distance: 5.0 } }
        });
        mouseUpHandler({ 
          target: mockHoldElement1,
          detail: { intersection: { distance: 5.0, point: { x: 1, y: 2, z: 3 } } } 
        });
        
        // Advance time by 200ms (within threshold)
        currentTime += 200;
        
        // Click second hold (different hold ID)
        mouseDownHandler({ 
          target: mockHoldElement2,
          detail: { intersection: { distance: 5.0 } }
        });
        mouseUpHandler({ 
          target: mockHoldElement2,
          detail: { intersection: { distance: 5.0, point: { x: 1, y: 2, z: 3 } } } 
        });
        
        expect(mockPeakedBus.emitHoldDoubleClicked).not.toHaveBeenCalled();
        expect(mockPeakedBus.emitHoldClicked).toHaveBeenCalledWith(42);
        expect(mockPeakedBus.emitHoldClicked).toHaveBeenCalledWith(99);
      });

      it('should reset double-click tracking after first double-click', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const createClickEvents = () => ({
          down: { 
            target: mockHoldElement,
            detail: { intersection: { distance: 5.0 } }
          },
          up: { 
            target: mockHoldElement,
            detail: { intersection: { distance: 5.0, point: { x: 1, y: 2, z: 3 } } } 
          }
        });

        // First click at time 1000000
        const click1 = createClickEvents();
        mouseDownHandler(click1.down);
        mouseUpHandler(click1.up);
        
        // Advance time by 200ms
        currentTime += 200;
        
        // Second click triggers double-click
        const click2 = createClickEvents();
        mouseDownHandler(click2.down);
        mouseUpHandler(click2.up);
        
        expect(mockPeakedBus.emitHoldDoubleClicked).toHaveBeenCalledWith(42);
        expect(mockPeakedBus.emitHoldDoubleClicked).toHaveBeenCalledTimes(1);
        
        // Advance time by 200ms
        currentTime += 200;
        
        // Third click should NOT trigger another double-click (tracking was reset)
        const click3 = createClickEvents();
        mouseDownHandler(click3.down);
        mouseUpHandler(click3.up);
        
        // Should still only have one double-click
        expect(mockPeakedBus.emitHoldDoubleClicked).toHaveBeenCalledTimes(1);
      });
    });

    describe('hold hover handling', () => {
      let mockPeakedBus: any;

      beforeEach(() => {
        mockPeakedBus = {
          emitHoldHovered: jasmine.createSpy('emitHoldHovered'),
          emitHoldUnhovered: jasmine.createSpy('emitHoldUnhovered'),
        };
        (window as any).peakedBus = mockPeakedBus;
      });

      afterEach(() => {
        delete (window as any).peakedBus;
      });

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
        expect(mockPeakedBus.emitHoldHovered).toHaveBeenCalledWith(77);
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
        expect(mockPeakedBus.emitHoldUnhovered).toHaveBeenCalledWith(77);
      });
    });

    describe('hold drag handling', () => {
      let mockPeakedBus: any;
      jasmine.clock();

      beforeEach(() => {
        jasmine.clock().install();
        
        mockPeakedBus = {
          emitHoldDragStarted: jasmine.createSpy('emitHoldDragStarted'),
          emitHoldDragUpdated: jasmine.createSpy('emitHoldDragUpdated'),
          emitHoldDragEnded: jasmine.createSpy('emitHoldDragEnded'),
          emitHoldClicked: jasmine.createSpy('emitHoldClicked'),
        };
        (window as any).peakedBus = mockPeakedBus;
      });

      afterEach(() => {
        jasmine.clock().uninstall();
        delete (window as any).peakedBus;
      });

      it('should start drag after 500ms hold on a hold element', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);

        // After 499ms, drag should not have started
        jasmine.clock().tick(499);
        expect(mockPeakedBus.emitHoldDragStarted).not.toHaveBeenCalled();

        // After 500ms, drag should start
        jasmine.clock().tick(1);
        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdDragStarted',
          jasmine.objectContaining({ holdId: 42 })
        );
        expect(mockPeakedBus.emitHoldDragStarted).toHaveBeenCalledWith(42);
      });

      it('should emit drag update events during mousemove while dragging', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseMoveHandler = eventListeners.get('mousemove')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };

        mouseDownHandler(mouseDownEvent);
        jasmine.clock().tick(500); // Start drag

        const mouseMoveEvent = {
          target: mockHoldElement,
          detail: { 
            intersection: { 
              point: { x: 1.5, y: 2.5, z: 3.5 } 
            } 
          }
        };

        consoleSpy.calls.reset();
        mouseMoveHandler(mouseMoveEvent);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdDragUpdated',
          jasmine.objectContaining({ 
            holdId: 42,
            point: { x: 1.5, y: 2.5, z: 3.5 }
          })
        );
        expect(mockPeakedBus.emitHoldDragUpdated).toHaveBeenCalledWith(
          42, 
          { x: 1.5, y: 2.5, z: 3.5 }
        );
      });

      it('should NOT emit drag updates if not dragging', () => {
        const mouseMoveHandler = eventListeners.get('mousemove')!;
        
        const mouseMoveEvent = {
          target: {},
          detail: { 
            intersection: { 
              point: { x: 1.5, y: 2.5, z: 3.5 } 
            } 
          }
        };

        consoleSpy.calls.reset();
        mouseMoveHandler(mouseMoveEvent);

        const dragUpdateCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('holdDragUpdated')
        );
        expect(dragUpdateCalls.length).toBe(0);
        expect(mockPeakedBus.emitHoldDragUpdated).not.toHaveBeenCalled();
      });

      it('should emit drag ended on mouseup after dragging', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };

        mouseDownHandler(mouseDownEvent);
        jasmine.clock().tick(500); // Start drag

        const mouseUpEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } } 
        };

        consoleSpy.calls.reset();
        mouseUpHandler(mouseUpEvent);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] holdDragEnded',
          jasmine.objectContaining({ holdId: 42 })
        );
        expect(mockPeakedBus.emitHoldDragEnded).toHaveBeenCalledWith(42);
      });

      it('should NOT emit click event if drag was active', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };

        mouseDownHandler(mouseDownEvent);
        jasmine.clock().tick(500); // Start drag

        const mouseUpEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } } 
        };

        consoleSpy.calls.reset();
        mouseUpHandler(mouseUpEvent);

        // Should not emit click
        expect(mockPeakedBus.emitHoldClicked).not.toHaveBeenCalled();
        const clickCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('holdClicked')
        );
        expect(clickCalls.length).toBe(0);
      });

      it('should NOT cancel drag timer on mouseleave if mouse button still down', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseLeaveHandler = eventListeners.get('mouseleave')!;
        
        // Add emitHoldUnhovered to the mock bus
        mockPeakedBus.emitHoldUnhovered = jasmine.createSpy('emitHoldUnhovered');
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };

        mouseDownHandler(mouseDownEvent);
        jasmine.clock().tick(300); // Partway through

        // Mouse leaves hold while button is still down
        mouseLeaveHandler({ target: mockHoldElement });

        // Complete the 500ms - drag SHOULD still start
        jasmine.clock().tick(200);

        // Drag should have started even though mouse left the hold
        expect(mockPeakedBus.emitHoldDragStarted).toHaveBeenCalledWith(42);
      });

      it('should cancel drag timer on mouseup before 500ms', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockHoldElement = {
          classList: { contains: (cls: string) => cls === 'hold' },
          getAttribute: (attr: string) => attr === 'data-hold-id' ? '42' : null,
          closest: (selector: string) => selector === '.hold' ? mockHoldElement : null,
        };

        const mouseDownEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } }
        };

        mouseDownHandler(mouseDownEvent);
        jasmine.clock().tick(300); // Partway through

        const mouseUpEvent = { 
          target: mockHoldElement,
          detail: { intersection: { distance: 5.0 } } 
        };

        mouseUpHandler(mouseUpEvent);

        // Complete the 500ms
        jasmine.clock().tick(200);

        // Should NOT have started drag, should have clicked
        expect(mockPeakedBus.emitHoldDragStarted).not.toHaveBeenCalled();
        expect(mockPeakedBus.emitHoldClicked).toHaveBeenCalledWith(42);
      });
    });

    describe('wall click handling', () => {
      let mockPeakedBus: any;

      beforeEach(() => {
        mockPeakedBus = {
          emitWallClicked: jasmine.createSpy('emitWallClicked'),
        };
        (window as any).peakedBus = mockPeakedBus;
      });

      afterEach(() => {
        delete (window as any).peakedBus;
      });

      it('should log wallClicked with intersection point (mousedown/up, no drag)', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };

        const mouseDownEvent = { 
          target: mockWallElement,
          detail: { intersection: { distance: 2.0 } }
        };
        const mouseUpEvent = { 
          target: mockWallElement,
          detail: { intersection: { distance: 2.0, point: { x: 0.5, y: 1.2, z: 0.1 } } } 
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] wallClicked',
          jasmine.objectContaining({
            point: { x: 0.5, y: 1.2, z: 0.1 },
            entityId: 'garage',
          })
        );
        expect(mockPeakedBus.emitWallClicked).toHaveBeenCalledWith({ x: 0.5, y: 1.2, z: 0.1 });
      });

      it('should handle wall click without intersection point (mousedown/up, no drag)', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };

        const mouseDownEvent = { 
          target: mockWallElement,
          detail: { intersection: { distance: 2.0 } }
        };
        const mouseUpEvent = { 
          target: mockWallElement,
          detail: {} 
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[desktop-interaction-manager] wallClicked (no intersection point)',
          jasmine.objectContaining({ point: null })
        );
        expect(mockPeakedBus.emitWallClicked).not.toHaveBeenCalled();
      });

      it('should NOT log wallClicked if intersection distance changes (drag)', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockWallElement = {
          id: 'garage',
          classList: { contains: (cls: string) => cls === 'wall' },
          getAttribute: () => null,
        };

        const mouseDownEvent = { 
          target: mockWallElement,
          detail: { intersection: { distance: 2.0 } }
        };
        const mouseUpEvent = { 
          target: mockWallElement,
          detail: { intersection: { distance: 3.0, point: { x: 0.5, y: 1.2, z: 0.1 } } } 
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

        const interactionCalls = consoleSpy.calls.all().filter(
          call => call.args[0]?.includes?.('wallClicked')
        );
        expect(interactionCalls.length).toBe(0);
        expect(mockPeakedBus.emitWallClicked).not.toHaveBeenCalled();
      });
    });

    describe('event filtering', () => {
      it('should ignore mouse events on elements without recognized classes', () => {
        const mouseDownHandler = eventListeners.get('mousedown')!;
        const mouseUpHandler = eventListeners.get('mouseup')!;
        
        const mockRandomElement = {
          classList: { contains: () => false },
          getAttribute: () => null,
        };

        const mouseDownEvent = { 
          target: mockRandomElement,
          detail: { intersection: { distance: 1.0 } }
        };
        const mouseUpEvent = { 
          target: mockRandomElement,
          detail: { intersection: { distance: 1.0 } }
        };

        consoleSpy.calls.reset();
        mouseDownHandler(mouseDownEvent);
        mouseUpHandler(mouseUpEvent);

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
          'mousedown',
          jasmine.any(Function)
        );
        expect(mockElement.removeEventListener).toHaveBeenCalledWith(
          'mouseup',
          jasmine.any(Function)
        );
        expect(mockElement.removeEventListener).toHaveBeenCalledWith(
          'mousemove',
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

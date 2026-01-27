/**
 * vr-button A-Frame Component Tests
 *
 * Tests for the VR button behaviour that provides hover effects
 * and click handling for VR controller interactions.
 */

import { registerVrButtonComponent } from './vr-button';

describe('vr-button A-Frame component', () => {
  let mockAFRAME: any;
  let registeredComponent: any;

  beforeEach(() => {
    // Create mock AFRAME
    mockAFRAME = {
      components: {},
      registerComponent: jasmine
        .createSpy('registerComponent')
        .and.callFake((name: string, definition: any) => {
          mockAFRAME.components[name] = definition;
          registeredComponent = definition;
        }),
    };

    // Set up global AFRAME
    (window as any).AFRAME = mockAFRAME;
  });

  afterEach(() => {
    delete (window as any).AFRAME;
  });

  describe('registration', () => {
    it('should register component with AFRAME', () => {
      registerVrButtonComponent();

      expect(mockAFRAME.registerComponent).toHaveBeenCalledWith(
        'vr-button',
        jasmine.any(Object)
      );
    });

    it('should skip registration if already registered', () => {
      // Pre-register the component
      mockAFRAME.components['vr-button'] = {};

      registerVrButtonComponent();

      expect(mockAFRAME.registerComponent).not.toHaveBeenCalled();
    });
  });

  describe('hover behaviour', () => {
    let componentInstance: any;
    let mockEl: any;
    let mockButtonBg: any;

    beforeEach(() => {
      registerVrButtonComponent();

      // Create mock button background element
      mockButtonBg = {
        id: 'test-button-bg',
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue('#238636'),
        setAttribute: jasmine.createSpy('setAttribute'),
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };

      // Create mock element
      mockEl = {
        id: 'test-button',
        children: [mockButtonBg],
        setAttribute: jasmine.createSpy('setAttribute'),
        emit: jasmine.createSpy('emit'),
        object3D: { visible: true },
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue(true),
        parentElement: null,
      };

      // Create component instance
      componentInstance = {
        el: mockEl,
        data: { hoverColor: '#2ea043', activeColor: '#1a7f37' },
        ...registeredComponent,
      };

      // Run init
      componentInstance.init();
    });

    it('should set isHovered true on raycaster-intersected', () => {
      const mockRaycaster = {
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };

      componentInstance.onIntersection({ detail: { el: mockRaycaster } });

      expect(componentInstance.isHovered).toBe(true);
    });

    it('should set isHovered false on raycaster-intersected-cleared', () => {
      componentInstance.isHovered = true;

      componentInstance.onIntersectionCleared({ detail: { el: null } });

      expect(componentInstance.isHovered).toBe(false);
    });

    it('should ignore intersection if element is not visible', () => {
      // Make element invisible
      mockEl.object3D.visible = false;

      const mockRaycaster = {
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };

      componentInstance.onIntersection({ detail: { el: mockRaycaster } });

      expect(componentInstance.isHovered).toBe(false);
    });
  });

  describe('click behaviour', () => {
    let componentInstance: any;
    let mockEl: any;
    let mockButtonBg: any;

    beforeEach(() => {
      registerVrButtonComponent();

      mockButtonBg = {
        id: 'test-button-bg',
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue('#238636'),
        setAttribute: jasmine.createSpy('setAttribute'),
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };

      mockEl = {
        id: 'test-button',
        children: [mockButtonBg],
        setAttribute: jasmine.createSpy('setAttribute'),
        emit: jasmine.createSpy('emit'),
        object3D: { visible: true },
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue(true),
        parentElement: null,
      };

      componentInstance = {
        el: mockEl,
        data: { hoverColor: '#2ea043', activeColor: '#1a7f37' },
        ...registeredComponent,
      };

      componentInstance.init();
    });

    it('should emit vr-button-click when trigger released while hovered', () => {
      componentInstance.isHovered = true;
      componentInstance.isPressed = true;

      componentInstance.onTriggerUp();

      expect(mockEl.emit).toHaveBeenCalledWith('vr-button-click', {}, false);
    });

    it('should not emit if not hovered when trigger released', () => {
      componentInstance.isHovered = false;
      componentInstance.isPressed = true;

      componentInstance.onTriggerUp();

      expect(mockEl.emit).not.toHaveBeenCalled();
    });

    it('should not emit if element is not visible', () => {
      componentInstance.isHovered = true;
      componentInstance.isPressed = true;
      mockEl.object3D.visible = false;

      componentInstance.onTriggerUp();

      expect(mockEl.emit).not.toHaveBeenCalled();
    });

    it('should have cooldown to prevent double-clicks', () => {
      componentInstance.isHovered = true;
      componentInstance.isPressed = true;

      // First click
      componentInstance.onTriggerUp();
      expect(mockEl.emit).toHaveBeenCalledTimes(1);

      // Second click immediately - should be blocked by cooldown
      componentInstance.isPressed = true;
      componentInstance.onTriggerUp();
      expect(mockEl.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    let componentInstance: any;
    let mockEl: any;
    let mockButtonBg: any;

    beforeEach(() => {
      registerVrButtonComponent();

      mockButtonBg = {
        id: 'test-button-bg',
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue('#238636'),
        setAttribute: jasmine.createSpy('setAttribute'),
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };

      mockEl = {
        id: 'test-button',
        children: [mockButtonBg],
        setAttribute: jasmine.createSpy('setAttribute'),
        emit: jasmine.createSpy('emit'),
        object3D: { visible: true },
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue(true),
        parentElement: null,
      };

      componentInstance = {
        el: mockEl,
        data: { hoverColor: '#2ea043', activeColor: '#1a7f37' },
        ...registeredComponent,
      };

      componentInstance.init();
    });

    it('should remove event listeners on remove', () => {
      componentInstance.remove();

      expect(mockButtonBg.removeEventListener).toHaveBeenCalledWith(
        'raycaster-intersected',
        jasmine.any(Function)
      );
      expect(mockButtonBg.removeEventListener).toHaveBeenCalledWith(
        'raycaster-intersected-cleared',
        jasmine.any(Function)
      );
    });
  });
});

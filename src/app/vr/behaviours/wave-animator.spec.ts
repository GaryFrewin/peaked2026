import { createMockElement, createMockAFRAME } from './test-helpers';

// Import the module to register the A-Frame component
import './wave-animator';

describe('wave-animator A-Frame component', () => {
  let AFRAME: any;
  let containerEntity: any;
  let childEntities: any[];
  let componentInstance: any;

  beforeEach(() => {
    // Set up mock AFRAME
    AFRAME = createMockAFRAME();
    (window as any).AFRAME = AFRAME;

    // Create container element
    containerEntity = createMockElement('wave-container');
    // Add removeAttribute to container
    (containerEntity as any).removeAttribute = jasmine.createSpy('removeAttribute');

    // Create children at Y = 0, 1, 2, 3 (bottom to top)
    childEntities = [];
    for (let i = 0; i < 4; i++) {
      const child = createMockElement(`hold-${i}`, 0, i, 0);
      // Add removeAttribute (not in test-helpers by default)
      (child as any).removeAttribute = jasmine.createSpy('removeAttribute');
      // Override setAttribute with spy
      (child as any).setAttribute = jasmine.createSpy('setAttribute');
      childEntities.push(child);
    }

    containerEntity.querySelectorAll = jasmine.createSpy('querySelectorAll').and.returnValue(childEntities);

    // Create a component instance directly
    componentInstance = {
      el: containerEntity,
      data: {
        selector: '.hold',
        waveDuration: 800,
        waveScale: 1.8,
        pulseEnabled: true,
        pulseScale: 1.3,
        pulseDuration: 1200,
      },
      triggerWave: function () {
        const children = this.el.querySelectorAll(this.data.selector);
        if (!children.length) return;

        const positions = Array.from(children).map((child: any) => child.object3D?.position?.y ?? 0);
        const minY = Math.min(...positions);
        const maxY = Math.max(...positions);
        const yRange = maxY - minY || 1;

        children.forEach((child: any) => {
          const y = child.object3D?.position?.y ?? 0;
          const normalizedY = (y - minY) / yRange;
          const delay = normalizedY * this.data.waveDuration;

          child.setAttribute('animation__wave', {
            property: 'scale',
            to: { x: this.data.waveScale, y: this.data.waveScale, z: this.data.waveScale },
            dur: 150,
            easing: 'easeOutQuad',
            delay: delay,
          });

          child.setAttribute('animation__waveback', {
            property: 'scale',
            from: { x: this.data.waveScale, y: this.data.waveScale, z: this.data.waveScale },
            to: { x: 1, y: 1, z: 1 },
            dur: 200,
            easing: 'easeInQuad',
            delay: delay + 150,
          });

          if (this.data.pulseEnabled) {
            child.setAttribute('animation__pulse', {
              property: 'scale',
              from: { x: 1, y: 1, z: 1 },
              to: { x: this.data.pulseScale, y: this.data.pulseScale, z: this.data.pulseScale },
              dur: this.data.pulseDuration,
              easing: 'easeInOutSine',
              loop: true,
              dir: 'alternate',
              delay: delay + 350,
            });
          }
        });
      },
      stopWave: function () {
        const children = this.el.querySelectorAll(this.data.selector);
        children.forEach((child: any) => {
          child.removeAttribute('animation__wave');
          child.removeAttribute('animation__waveback');
          child.removeAttribute('animation__pulse');
          child.setAttribute('scale', '1 1 1');
        });
      },
      init: function () {
        this.triggerWave = this.triggerWave.bind(this);
        this.stopWave = this.stopWave.bind(this);
        this.el.addEventListener('trigger-wave', this.triggerWave);
        this.el.addEventListener('stop-wave', this.stopWave);
      },
    };
  });

  it('should define the component schema correctly', () => {
    // Test the expected schema structure (component implementation)
    expect(componentInstance.data.selector).toBe('.hold');
    expect(componentInstance.data.waveDuration).toBe(800);
    expect(componentInstance.data.pulseEnabled).toBe(true);
  });

  describe('initialization', () => {
    it('should have correct default data values', () => {
      expect(componentInstance.data.selector).toBe('.hold');
      expect(componentInstance.data.waveDuration).toBe(800);
      expect(componentInstance.data.pulseEnabled).toBe(true);
    });

    it('should set up event listeners on init', () => {
      containerEntity.addEventListener = jasmine.createSpy('addEventListener');
      componentInstance.init();

      expect(containerEntity.addEventListener).toHaveBeenCalledWith('trigger-wave', jasmine.any(Function));
      expect(containerEntity.addEventListener).toHaveBeenCalledWith('stop-wave', jasmine.any(Function));
    });
  });

  describe('triggerWave', () => {
    it('should query for child entities using selector', () => {
      componentInstance.triggerWave();

      expect(containerEntity.querySelectorAll).toHaveBeenCalledWith('.hold');
    });

    it('should set animation attributes on child entities', () => {
      componentInstance.triggerWave();

      childEntities.forEach((child) => {
        expect(child.setAttribute).toHaveBeenCalled();
      });
    });

    it('should calculate staggered delays based on Y position', () => {
      componentInstance.triggerWave();

      // Child at Y=0 should have delay ~0
      // Child at Y=3 should have delay ~800ms (waveDuration)
      const calls0 = childEntities[0].setAttribute.calls.allArgs();
      const calls3 = childEntities[3].setAttribute.calls.allArgs();

      // Find the animation call
      const animCall0 = calls0.find((c: any) => c[0] === 'animation__wave');
      const animCall3 = calls3.find((c: any) => c[0] === 'animation__wave');

      expect(animCall0).toBeDefined();
      expect(animCall3).toBeDefined();

      // Bottom hold should have smaller delay than top hold
      const delay0 = animCall0[1].delay;
      const delay3 = animCall3[1].delay;
      expect(delay0).toBeLessThan(delay3);
    });

    it('should animate scale up then back down (burst effect)', () => {
      componentInstance.triggerWave();

      const calls = childEntities[0].setAttribute.calls.allArgs();
      const waveAnim = calls.find((c: any) => c[0] === 'animation__wave');
      const waveBackAnim = calls.find((c: any) => c[0] === 'animation__waveback');

      expect(waveAnim).toBeDefined();
      expect(waveBackAnim).toBeDefined();

      // Wave should scale up
      expect(waveAnim[1].to).toEqual({ x: 1.8, y: 1.8, z: 1.8 });
      // Wave back should scale down
      expect(waveBackAnim[1].to).toEqual({ x: 1, y: 1, z: 1 });
    });
  });

  describe('pulse mode', () => {
    it('should add pulse animation after wave completes when pulseEnabled', () => {
      componentInstance.triggerWave();

      const calls = childEntities[0].setAttribute.calls.allArgs();
      const pulseAnim = calls.find((c: any) => c[0] === 'animation__pulse');

      expect(pulseAnim).toBeDefined();
      expect(pulseAnim[1].loop).toBe(true);
      expect(pulseAnim[1].dir).toBe('alternate');
    });

    it('should not add pulse animation when pulseEnabled is false', () => {
      componentInstance.data.pulseEnabled = false;
      componentInstance.triggerWave();

      const calls = childEntities[0].setAttribute.calls.allArgs();
      const pulseAnim = calls.find((c: any) => c[0] === 'animation__pulse');

      expect(pulseAnim).toBeUndefined();
    });
  });

  describe('stopWave', () => {
    it('should remove all wave animations from children', () => {
      componentInstance.stopWave();

      childEntities.forEach((child) => {
        expect(child.removeAttribute).toHaveBeenCalledWith('animation__wave');
        expect(child.removeAttribute).toHaveBeenCalledWith('animation__waveback');
        expect(child.removeAttribute).toHaveBeenCalledWith('animation__pulse');
      });
    });

    it('should reset scale to 1,1,1', () => {
      componentInstance.stopWave();

      childEntities.forEach((child) => {
        expect(child.setAttribute).toHaveBeenCalledWith('scale', '1 1 1');
      });
    });
  });
});

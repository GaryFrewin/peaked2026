import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseSceneComponent } from './base-scene';

/**
 * BASE SCENE COMPONENT TESTS
 *
 * Tests for the shared A-Frame scene container.
 * Route visualization is handled by route-hold-renderer A-Frame component.
 */
describe('BaseSceneComponent', () => {
  let component: BaseSceneComponent;
  let fixture: ComponentFixture<BaseSceneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseSceneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseSceneComponent);
    component = fixture.componentInstance;
  });

  it('test_should_create', () => {
    expect(component).toBeTruthy();
  });

  it('test_should_accept_wallModelUrl_input', () => {
    fixture.componentRef.setInput('wallModelUrl', 'https://example.com/wall.glb');
    expect(component.wallModelUrl()).toBe('https://example.com/wall.glb');
  });

  it('test_should_accept_holds_input', () => {
    const holds = [
      { id: 1, x: 0, y: 1, z: 0, wall_version_id: 1, usage_count: 0, date_created: '', date_modified: '' },
    ];
    fixture.componentRef.setInput('holds', holds);
    expect(component.holds()).toEqual(holds);
  });

  it('test_should_accept_visible_input', () => {
    fixture.componentRef.setInput('visible', false);
    expect(component.visible()).toBe(false);
  });

  it('test_should_have_visible_default_to_true', () => {
    fixture.detectChanges();
    expect(component.visible()).toBe(true);
  });

  it('test_should_emit_sceneReady_when_aframe_scene_loads', (done) => {
    component.sceneReady.subscribe(() => {
      expect(true).toBe(true);
      done();
    });

    fixture.detectChanges();

    // Simulate A-Frame scene loaded event
    const scene = fixture.nativeElement.querySelector('a-scene');
    if (scene) {
      const loadedEvent = new Event('loaded');
      scene.dispatchEvent(loadedEvent);
    }
  });
});

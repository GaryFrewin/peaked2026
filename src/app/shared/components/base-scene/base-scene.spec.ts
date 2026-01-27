import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseSceneComponent } from './base-scene';

describe('BaseSceneComponent', () => {
  let component: BaseSceneComponent;
  let fixture: ComponentFixture<BaseSceneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseSceneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaseSceneComponent);
    fixture.componentRef.setInput('wallModelUrl', 'https://example.com/wall.gltf');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept wallModelUrl input', () => {
    expect(component.wallModelUrl()).toBe('https://example.com/wall.gltf');
  });

  it('should have visible default to true', () => {
    expect(component.visible()).toBe(true);
  });

  it('should render a-scene element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const scene = compiled.querySelector('a-scene');
    expect(scene).toBeTruthy();
  });

  it('should render wall-environment entity', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const wallEnv = compiled.querySelector('#wall-environment');
    expect(wallEnv).toBeTruthy();
  });

  it('should render wall-container entity', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const wallContainer = compiled.querySelector('#wall-container');
    expect(wallContainer).toBeTruthy();
  });

  it('should render hold-container entity', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const holdContainer = compiled.querySelector('#hold-container');
    expect(holdContainer).toBeTruthy();
  });
});

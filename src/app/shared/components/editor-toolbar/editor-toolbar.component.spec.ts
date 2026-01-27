import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorToolbarComponent, ToolItem } from './editor-toolbar.component';

describe('EditorToolbarComponent', () => {
  let component: EditorToolbarComponent;
  let fixture: ComponentFixture<EditorToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have tools defined', () => {
    expect(component.tools.length).toBeGreaterThan(0);
  });

  it('should initialize with view mode active', () => {
    expect(component.activeTool()).toBe('view');
  });

  describe('hover interactions', () => {
    it('should track hovered tool', () => {
      expect(component.hoveredTool()).toBeNull();

      component.onToolHover('editHolds');
      expect(component.hoveredTool()).toBe('editHolds');

      component.onToolHover(null);
      expect(component.hoveredTool()).toBeNull();
    });

    it('should return true for isHovered when tool matches', () => {
      component.onToolHover('createRoute');
      expect(component.isHovered('createRoute')).toBeTrue();
      expect(component.isHovered('view')).toBeFalse();
    });
  });

  describe('click interactions', () => {
    it('should set active tool on click', () => {
      const tool: ToolItem = { id: 'editHolds', icon: '📍', label: 'Edit Holds' };
      component.onToolClick(tool);
      expect(component.activeTool()).toBe('editHolds');
    });

    it('should emit toolSelected on click', () => {
      const emitSpy = spyOn(component.toolSelected, 'emit');
      const tool: ToolItem = { id: 'createRoute', icon: '➕', label: 'New Route' };

      component.onToolClick(tool);

      expect(emitSpy).toHaveBeenCalledWith('createRoute');
    });

    it('should not emit for disabled tools', () => {
      const emitSpy = spyOn(component.toolSelected, 'emit');
      const tool: ToolItem = { id: 'disabled', icon: '🚫', label: 'Disabled', disabled: true };

      component.onToolClick(tool);

      expect(emitSpy).not.toHaveBeenCalled();
      expect(component.activeTool()).toBe('view'); // unchanged
    });
  });

  describe('isActive', () => {
    it('should return true for active tool', () => {
      expect(component.isActive('view')).toBeTrue();
      expect(component.isActive('editHolds')).toBeFalse();
    });
  });

  describe('animation delay', () => {
    it('should calculate staggered delay based on index', () => {
      expect(component.getAnimationDelay(0)).toBe('0ms');
      expect(component.getAnimationDelay(1)).toBe('30ms');
      expect(component.getAnimationDelay(5)).toBe('150ms');
    });
  });
});

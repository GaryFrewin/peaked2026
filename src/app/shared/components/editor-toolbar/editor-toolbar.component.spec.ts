import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorToolbarComponent, ToolItem } from './editor-toolbar.component';
import { EditorService } from '../../editor/editor.service';
import { ViewTool } from '../../editor/tools/view.tool';
import { EditHoldsTool } from '../../editor/tools/edit-holds.tool';
import { signal } from '@angular/core';

describe('EditorToolbarComponent', () => {
  let component: EditorToolbarComponent;
  let fixture: ComponentFixture<EditorToolbarComponent>;
  let mockEditorService: jasmine.SpyObj<EditorService>;

  beforeEach(async () => {
    mockEditorService = jasmine.createSpyObj('EditorService', ['setTool', 'registerTool'], {
      activeToolId: signal('view'),
    });

    // Mock tools
    const mockViewTool = { id: 'view', label: 'View Mode', icon: '👁️' };
    const mockEditHoldsTool = { id: 'editHolds', label: 'Edit Holds', icon: '📍' };

    await TestBed.configureTestingModule({
      imports: [EditorToolbarComponent],
      providers: [
        { provide: EditorService, useValue: mockEditorService },
        { provide: ViewTool, useValue: mockViewTool },
        { provide: EditHoldsTool, useValue: mockEditHoldsTool },
      ],
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

  it('should get active tool from EditorService', () => {
    expect(component.activeTool()).toBe('view');
  });

  describe('initialization', () => {
    it('should register tools with EditorService on init', () => {
      expect(mockEditorService.registerTool).toHaveBeenCalledTimes(2);
    });

    it('should set view tool as default on init', () => {
      expect(mockEditorService.setTool).toHaveBeenCalledWith('view');
    });
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
    it('should call editorService.setTool on click', () => {
      // Reset the spy since ngOnInit already called setTool('view')
      mockEditorService.setTool.calls.reset();
      
      const tool: ToolItem = { id: 'editHolds', icon: '📍', label: 'Edit Holds' };
      component.onToolClick(tool);
      expect(mockEditorService.setTool).toHaveBeenCalledWith('editHolds');
    });

    it('should emit toolSelected on click', () => {
      const emitSpy = spyOn(component.toolSelected, 'emit');
      const tool: ToolItem = { id: 'createRoute', icon: '➕', label: 'New Route' };

      component.onToolClick(tool);

      expect(emitSpy).toHaveBeenCalledWith('createRoute');
    });

    it('should not call editorService for disabled tools', () => {
      // Reset the spy since ngOnInit already called setTool('view')
      mockEditorService.setTool.calls.reset();
      
      const emitSpy = spyOn(component.toolSelected, 'emit');
      const tool: ToolItem = { id: 'disabled', icon: '🚫', label: 'Disabled', disabled: true };

      component.onToolClick(tool);

      expect(mockEditorService.setTool).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('isActive', () => {
    it('should return true for active tool from service', () => {
      expect(component.isActive('view')).toBeTrue();
      expect(component.isActive('editHolds')).toBeFalse();
    });

    it('should reflect service activeToolId changes', () => {
      // Simulate service changing active tool
      (mockEditorService.activeToolId as any).set('editHolds');
      
      expect(component.isActive('editHolds')).toBeTrue();
      expect(component.isActive('view')).toBeFalse();
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

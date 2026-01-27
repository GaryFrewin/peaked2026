import { TestBed } from '@angular/core/testing';
import { ViewTool } from './view.tool';
import { EditorStore } from '../../../stores/editor.store';

describe('ViewTool', () => {
  let tool: ViewTool;
  let mockEditorStore: jasmine.SpyObj<EditorStore>;

  beforeEach(() => {
    mockEditorStore = jasmine.createSpyObj('EditorStore', [
      'clearSelection',
      'setHoveredHold',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ViewTool,
        { provide: EditorStore, useValue: mockEditorStore },
      ],
    });

    tool = TestBed.inject(ViewTool);
  });

  describe('properties', () => {
    it('should have correct id', () => {
      expect(tool.id).toBe('view');
    });

    it('should have correct label', () => {
      expect(tool.label).toBe('View');
    });

    it('should have correct icon', () => {
      expect(tool.icon).toBe('👁');
    });

    it('should have shortcut V', () => {
      expect(tool.shortcut).toBe('V');
    });
  });

  describe('onActivate', () => {
    it('should clear selection when activated', () => {
      tool.onActivate();

      expect(mockEditorStore.clearSelection).toHaveBeenCalled();
    });
  });

  describe('onHoldClick', () => {
    it('should NOT be defined - view mode does not handle clicks', () => {
      // View tool is passive - clicking holds does nothing
      // Cast to any to check the property doesn't exist
      expect((tool as any).onHoldClick).toBeUndefined();
    });
  });

  describe('onHoldHover', () => {
    it('should set hovered hold for visual feedback', () => {
      tool.onHoldHover(42);

      expect(mockEditorStore.setHoveredHold).toHaveBeenCalledWith(42);
    });
  });

  describe('onHoldHoverEnd', () => {
    it('should clear hovered hold', () => {
      tool.onHoldHoverEnd(42);

      expect(mockEditorStore.setHoveredHold).toHaveBeenCalledWith(null);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { EditHoldsTool } from './edit-holds.tool';
import { EditorStore } from '../../../stores/editor.store';
import { signal } from '@angular/core';

describe('EditHoldsTool', () => {
  let tool: EditHoldsTool;
  let mockEditorStore: jasmine.SpyObj<EditorStore>;

  beforeEach(() => {
    mockEditorStore = jasmine.createSpyObj('EditorStore', [
      'clearSelection',
      'toggleHoldSelection',
      'setHoveredHold',
    ], {
      selectedHoldIds: signal<number[]>([]),
    });

    TestBed.configureTestingModule({
      providers: [
        EditHoldsTool,
        { provide: EditorStore, useValue: mockEditorStore },
      ],
    });

    tool = TestBed.inject(EditHoldsTool);
  });

  describe('properties', () => {
    it('should have correct id', () => {
      expect(tool.id).toBe('editHolds');
    });

    it('should have correct label', () => {
      expect(tool.label).toBe('Edit Holds');
    });

    it('should have correct icon', () => {
      expect(tool.icon).toBe('✋');
    });

    it('should have shortcut H', () => {
      expect(tool.shortcut).toBe('H');
    });
  });

  describe('onActivate', () => {
    it('should clear selection when activated', () => {
      tool.onActivate();

      expect(mockEditorStore.clearSelection).toHaveBeenCalled();
    });
  });

  describe('onDeactivate', () => {
    it('should clear selection when deactivated', () => {
      tool.onDeactivate();

      expect(mockEditorStore.clearSelection).toHaveBeenCalled();
    });
  });

  describe('onHoldClick', () => {
    it('should toggle hold selection', () => {
      tool.onHoldClick(42);

      expect(mockEditorStore.toggleHoldSelection).toHaveBeenCalledWith(42);
    });

    it('should toggle different hold ids', () => {
      tool.onHoldClick(1);
      tool.onHoldClick(2);
      tool.onHoldClick(3);

      expect(mockEditorStore.toggleHoldSelection).toHaveBeenCalledWith(1);
      expect(mockEditorStore.toggleHoldSelection).toHaveBeenCalledWith(2);
      expect(mockEditorStore.toggleHoldSelection).toHaveBeenCalledWith(3);
    });
  });

  describe('onHoldHover', () => {
    it('should set hovered hold for highlight effect', () => {
      tool.onHoldHover(99);

      expect(mockEditorStore.setHoveredHold).toHaveBeenCalledWith(99);
    });
  });

  describe('onHoldHoverEnd', () => {
    it('should clear hovered hold', () => {
      tool.onHoldHoverEnd(99);

      expect(mockEditorStore.setHoveredHold).toHaveBeenCalledWith(null);
    });
  });
});

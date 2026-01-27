import { TestBed } from '@angular/core/testing';
import { EditorService } from './editor.service';
import { EditorTool } from './editor-tool.interface';
import { EditorStore } from '../../stores/editor.store';

describe('EditorService', () => {
  let service: EditorService;
  let mockEditorStore: jasmine.SpyObj<EditorStore>;

  // Mock tools for testing
  const createMockTool = (id: string, overrides: Partial<EditorTool> = {}): EditorTool => ({
    id,
    label: `${id} Tool`,
    icon: '🔧',
    onActivate: jasmine.createSpy(`${id}.onActivate`),
    onDeactivate: jasmine.createSpy(`${id}.onDeactivate`),
    onHoldClick: jasmine.createSpy(`${id}.onHoldClick`),
    ...overrides,
  });

  beforeEach(() => {
    mockEditorStore = jasmine.createSpyObj('EditorStore', ['setMode']);

    TestBed.configureTestingModule({
      providers: [
        EditorService,
        { provide: EditorStore, useValue: mockEditorStore },
      ],
    });

    service = TestBed.inject(EditorService);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with no active tool', () => {
      expect(service.activeTool()).toBeNull();
    });

    it('should have empty activeToolId when no tool selected', () => {
      expect(service.activeToolId()).toBe('');
    });
  });

  describe('registerTool', () => {
    it('should register a tool', () => {
      const tool = createMockTool('testTool');
      service.registerTool(tool);

      expect(service.getRegisteredTools()).toContain(tool);
    });

    it('should register multiple tools', () => {
      const tool1 = createMockTool('tool1');
      const tool2 = createMockTool('tool2');

      service.registerTool(tool1);
      service.registerTool(tool2);

      expect(service.getRegisteredTools().length).toBe(2);
    });

    it('should replace tool if same id registered twice', () => {
      const tool1 = createMockTool('sameTool', { label: 'First' });
      const tool2 = createMockTool('sameTool', { label: 'Second' });

      service.registerTool(tool1);
      service.registerTool(tool2);

      const tools = service.getRegisteredTools();
      expect(tools.length).toBe(1);
      expect(tools[0].label).toBe('Second');
    });
  });

  describe('setTool', () => {
    it('should set the active tool', () => {
      const tool = createMockTool('myTool');
      service.registerTool(tool);

      service.setTool('myTool');

      expect(service.activeTool()).toBe(tool);
      expect(service.activeToolId()).toBe('myTool');
    });

    it('should call onActivate when tool is set', () => {
      const tool = createMockTool('myTool');
      service.registerTool(tool);

      service.setTool('myTool');

      expect(tool.onActivate).toHaveBeenCalledTimes(1);
    });

    it('should call onDeactivate on previous tool when switching', () => {
      const tool1 = createMockTool('tool1');
      const tool2 = createMockTool('tool2');
      service.registerTool(tool1);
      service.registerTool(tool2);

      service.setTool('tool1');
      service.setTool('tool2');

      expect(tool1.onDeactivate).toHaveBeenCalledTimes(1);
      expect(tool2.onActivate).toHaveBeenCalledTimes(1);
    });

    it('should set activeTool to null for unknown tool id', () => {
      service.setTool('nonexistent');

      expect(service.activeTool()).toBeNull();
    });

    it('should not call onDeactivate if no previous tool', () => {
      const tool = createMockTool('myTool');
      service.registerTool(tool);

      service.setTool('myTool');

      // onDeactivate should not be called since there was no previous tool
      expect(tool.onDeactivate).not.toHaveBeenCalled();
    });

    it('should handle tool without onActivate gracefully', () => {
      const tool: EditorTool = {
        id: 'minimal',
        label: 'Minimal Tool',
        icon: '📌',
        // No onActivate defined
      };
      service.registerTool(tool);

      expect(() => service.setTool('minimal')).not.toThrow();
      expect(service.activeTool()).toBe(tool);
    });
  });

  describe('handleHoldClick', () => {
    it('should forward click to active tool', () => {
      const tool = createMockTool('clickable');
      service.registerTool(tool);
      service.setTool('clickable');

      service.handleHoldClick(42);

      expect(tool.onHoldClick).toHaveBeenCalledWith(42);
    });

    it('should do nothing if no active tool', () => {
      expect(() => service.handleHoldClick(42)).not.toThrow();
    });

    it('should do nothing if active tool has no onHoldClick', () => {
      const tool: EditorTool = {
        id: 'noClick',
        label: 'No Click Tool',
        icon: '🚫',
      };
      service.registerTool(tool);
      service.setTool('noClick');

      expect(() => service.handleHoldClick(42)).not.toThrow();
    });
  });

  describe('handleHoldHover', () => {
    it('should forward hover to active tool', () => {
      const tool = createMockTool('hoverable');
      tool.onHoldHover = jasmine.createSpy('onHoldHover');
      service.registerTool(tool);
      service.setTool('hoverable');

      service.handleHoldHover(123);

      expect(tool.onHoldHover).toHaveBeenCalledWith(123);
    });

    it('should do nothing if tool has no onHoldHover', () => {
      const tool = createMockTool('noHover');
      service.registerTool(tool);
      service.setTool('noHover');

      expect(() => service.handleHoldHover(123)).not.toThrow();
    });
  });

  describe('handleHoldHoverEnd', () => {
    it('should forward hover end to active tool', () => {
      const tool = createMockTool('hoverable');
      tool.onHoldHoverEnd = jasmine.createSpy('onHoldHoverEnd');
      service.registerTool(tool);
      service.setTool('hoverable');

      service.handleHoldHoverEnd(123);

      expect(tool.onHoldHoverEnd).toHaveBeenCalledWith(123);
    });
  });

  describe('handleWallClick', () => {
    it('should forward wall click to active tool', () => {
      const tool = createMockTool('wallClicker');
      tool.onWallClick = jasmine.createSpy('onWallClick');
      service.registerTool(tool);
      service.setTool('wallClicker');

      const position = { x: 1, y: 2, z: 3 };
      service.handleWallClick(position);

      expect(tool.onWallClick).toHaveBeenCalledWith(position);
    });

    it('should do nothing if tool has no onWallClick', () => {
      const tool = createMockTool('noWallClick');
      service.registerTool(tool);
      service.setTool('noWallClick');

      expect(() => service.handleWallClick({ x: 0, y: 0, z: 0 })).not.toThrow();
    });
  });

  describe('clearTool', () => {
    it('should deactivate current tool and set to null', () => {
      const tool = createMockTool('myTool');
      service.registerTool(tool);
      service.setTool('myTool');

      service.clearTool();

      expect(tool.onDeactivate).toHaveBeenCalled();
      expect(service.activeTool()).toBeNull();
      expect(service.activeToolId()).toBe('');
    });
  });
});

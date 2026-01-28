import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorToolbarComponent } from './editor-toolbar.component';
import { ModeStore, AppMode } from '../../../stores/mode.store';

describe('EditorToolbarComponent', () => {
  let component: EditorToolbarComponent;
  let fixture: ComponentFixture<EditorToolbarComponent>;
  let modeStore: ModeStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorToolbarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorToolbarComponent);
    component = fixture.componentInstance;
    modeStore = TestBed.inject(ModeStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('tool clicks', () => {
    it('should set mode to View when view tool clicked', () => {
      modeStore.setMode(AppMode.EditHolds); // Start in different mode
      const viewTool = component.tools.find(t => t.id === 'view')!;
      component.onToolClick(viewTool);
      expect(modeStore.mode()).toBe(AppMode.View);
    });

    it('should set mode to EditHolds when edit holds tool clicked', () => {
      const tool = component.tools.find(t => t.id === 'editHolds')!;
      component.onToolClick(tool);
      expect(modeStore.mode()).toBe(AppMode.EditHolds);
    });

    it('should set mode to CreateRoute when create route tool clicked', () => {
      const tool = component.tools.find(t => t.id === 'createRoute')!;
      component.onToolClick(tool);
      expect(modeStore.mode()).toBe(AppMode.CreateRoute);
    });

    it('should set mode to EditRoute when edit route tool clicked', () => {
      const tool = component.tools.find(t => t.id === 'editRoute')!;
      component.onToolClick(tool);
      expect(modeStore.mode()).toBe(AppMode.EditRoute);
    });

    it('should emit toolSelected when tool clicked', () => {
      const emittedIds: string[] = [];
      component.toolSelected.subscribe(id => emittedIds.push(id));

      const tool = component.tools.find(t => t.id === 'editHolds')!;
      component.onToolClick(tool);

      expect(emittedIds).toContain('editHolds');
    });

    it('should not change mode for disabled tool', () => {
      const tool = { ...component.tools[0], disabled: true };
      modeStore.setMode(AppMode.View);
      component.onToolClick(tool);
      // Mode unchanged because tool was disabled
      expect(modeStore.mode()).toBe(AppMode.View);
    });
  });

  describe('isActive', () => {
    it('should return true when tool mode matches current mode', () => {
      modeStore.setMode(AppMode.EditHolds);
      expect(component.isActive('editHolds')).toBe(true);
    });

    it('should return false when tool mode does not match current mode', () => {
      modeStore.setMode(AppMode.View);
      expect(component.isActive('editHolds')).toBe(false);
    });

    it('should return false for tools without mode', () => {
      expect(component.isActive('save')).toBe(false);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EditorToolbarComponent } from './editor-toolbar.component';
import { ModeStore, AppMode } from '../../../stores/mode.store';
import { CreateRouteStateStore } from '../../../stores/create-route-state.store';
import { signal } from '@angular/core';

describe('EditorToolbarComponent', () => {
  let component: EditorToolbarComponent;
  let fixture: ComponentFixture<EditorToolbarComponent>;
  let modeStore: ModeStore;

  const mockCreateRouteStateStore = {
    draftRoute: signal(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorToolbarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CreateRouteStateStore, useValue: mockCreateRouteStateStore },
      ],
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

  describe('isDisabled', () => {
    it('should_disable_save_when_not_in_CreateRoute_mode', () => {
      modeStore.setMode(AppMode.View);
      expect(component.isDisabled('save')).toBe(true);
    });

    it('should_disable_save_when_canSave_input_is_false', () => {
      modeStore.setMode(AppMode.CreateRoute);
      // canSave input defaults to false
      expect(component.isDisabled('save')).toBe(true);
    });

    it('should_enable_save_when_in_CreateRoute_and_canSave_is_true', () => {
      modeStore.setMode(AppMode.CreateRoute);
      fixture.componentRef.setInput('canSave', true);
      fixture.detectChanges();
      expect(component.isDisabled('save')).toBe(false);
    });

    it('should_not_disable_non_save_tools', () => {
      expect(component.isDisabled('view')).toBe(false);
      expect(component.isDisabled('editHolds')).toBe(false);
    });
  });
});

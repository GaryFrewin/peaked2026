import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModeIndicatorComponent } from './mode-indicator.component';
import { ModeStore, AppMode } from '../../../stores/mode.store';

describe('ModeIndicatorComponent', () => {
  let component: ModeIndicatorComponent;
  let fixture: ComponentFixture<ModeIndicatorComponent>;
  let modeStore: ModeStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeIndicatorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModeIndicatorComponent);
    component = fixture.componentInstance;
    modeStore = TestBed.inject(ModeStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show border in View mode', () => {
    modeStore.setMode(AppMode.View);
    fixture.detectChanges();
    const border = fixture.nativeElement.querySelector('.mode-border');
    expect(border).toBeFalsy();
  });

  it('should show yellow border in EditHolds mode', () => {
    modeStore.setMode(AppMode.EditHolds);
    fixture.detectChanges();
    const border = fixture.nativeElement.querySelector('.mode-border');
    expect(border).toBeTruthy();
    expect(border.classList.contains('mode-edit-holds')).toBeTrue();
  });

  it('should show green border in CreateRoute mode', () => {
    modeStore.setMode(AppMode.CreateRoute);
    fixture.detectChanges();
    const border = fixture.nativeElement.querySelector('.mode-border');
    expect(border).toBeTruthy();
    expect(border.classList.contains('mode-create-route')).toBeTrue();
  });

  it('should show label text for EditHolds mode', () => {
    modeStore.setMode(AppMode.EditHolds);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.mode-label');
    expect(label.textContent).toContain('Edit Holds');
  });

  it('should show label text for CreateRoute mode', () => {
    modeStore.setMode(AppMode.CreateRoute);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.mode-label');
    expect(label.textContent).toContain('Create Route');
  });
});

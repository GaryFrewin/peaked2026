import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let el: HTMLElement;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('when user wants to enter VR mode', () => {
    it('should show a VR mode option', () => {
      const vrButton = el.querySelector('[data-testid="vr-mode-btn"]');
      expect(vrButton).toBeTruthy();
    });

    it('should navigate to VR viewer when VR button clicked', () => {
      const vrButton = el.querySelector<HTMLButtonElement>(
        '[data-testid="vr-mode-btn"]'
      );
      vrButton?.click();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/vr/viewer']);
    });
  });

  describe('when user wants to use desktop mode', () => {
    it('should show a Desktop mode option', () => {
      const desktopButton = el.querySelector('[data-testid="desktop-mode-btn"]');
      expect(desktopButton).toBeTruthy();
    });

    it('should navigate to desktop viewer when clicked', () => {
      const desktopButton = el.querySelector<HTMLButtonElement>(
        '[data-testid="desktop-mode-btn"]'
      );
      desktopButton?.click();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/desktop/viewer']);
    });
  });

  describe('when user wants to log climbing distance', () => {
    it('should show a distance logger option', () => {
      const loggerButton = el.querySelector(
        '[data-testid="distance-logger-btn"]'
      );
      expect(loggerButton).toBeTruthy();
    });

    it('should navigate to distance logger when clicked', () => {
      const loggerButton = el.querySelector<HTMLButtonElement>(
        '[data-testid="distance-logger-btn"]'
      );
      loggerButton?.click();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/distance-logger']);
    });
  });

  describe('when user wants to access dev playgrounds', () => {
    it('should show a way to access playgrounds', () => {
      const playgroundsTab = el.querySelector(
        '[data-testid="playgrounds-tab"]'
      );
      expect(playgroundsTab).toBeTruthy();
    });

    it('should show playground options when playgrounds section is accessed', () => {
      const playgroundsTab = el.querySelector<HTMLButtonElement>(
        '[data-testid="playgrounds-tab"]'
      );
      playgroundsTab?.click();
      fixture.detectChanges();

      const playgroundButtons = el.querySelectorAll(
        '[data-testid^="playground-"]'
      );
      expect(playgroundButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to selected playground', () => {
      const playgroundsTab = el.querySelector<HTMLButtonElement>(
        '[data-testid="playgrounds-tab"]'
      );
      playgroundsTab?.click();
      fixture.detectChanges();

      const basicPlayground = el.querySelector<HTMLButtonElement>(
        '[data-testid="playground-basic"]'
      );
      basicPlayground?.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/vr/basic']);
    });
  });
});

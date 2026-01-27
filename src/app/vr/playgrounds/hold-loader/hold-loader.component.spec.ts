import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HoldLoaderComponent } from './hold-loader.component';
import { Hold } from '../../../data-contracts/hold.model';
import { EditorService } from '../../../shared/editor/editor.service';
import { EditorStore } from '../../../stores/editor.store';

describe('HoldLoaderComponent', () => {
  let component: HoldLoaderComponent;
  let fixture: ComponentFixture<HoldLoaderComponent>;
  let httpMock: HttpTestingController;
  let mockEditorService: jasmine.SpyObj<EditorService>;
  let mockEditorStore: jasmine.SpyObj<EditorStore>;

  const mockHolds: Hold[] = [
    {
      id: 7,
      x: 2.461906177864066,
      y: 1.3611461408213918,
      z: -1.7974523357783219,
      usage_count: 0,
      wall_version_id: 3,
      date_created: 'Sun, 27 Apr 2025 20:31:31 GMT',
      date_modified: 'Sun, 27 Apr 2025 19:31:31 GMT'
    },
    {
      id: 8,
      x: 2.503329593988008,
      y: 1.719650764607326,
      z: -1.0980179505492023,
      usage_count: 0,
      wall_version_id: 3,
      date_created: 'Sun, 27 Apr 2025 20:31:31 GMT',
      date_modified: 'Sun, 27 Apr 2025 19:31:31 GMT'
    }
  ];

  beforeEach(async () => {
    mockEditorService = jasmine.createSpyObj('EditorService', ['handleHoldClick'], {
      activeToolId: signal('view'),
    });
    
    mockEditorStore = jasmine.createSpyObj('EditorStore', ['toggleHoldSelection'], {
      selectedHoldIds: signal(new Set<number>()),
    });

    await TestBed.configureTestingModule({
      imports: [HoldLoaderComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EditorService, useValue: mockEditorService },
        { provide: EditorStore, useValue: mockEditorStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HoldLoaderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.componentRef.setInput('wallId', 1);
    fixture.componentRef.setInput('versionId', 3);
    fixture.componentRef.setInput('modelUrl', 'https://test.com/model.glb');
    fixture.detectChanges();

    const req = httpMock.expectOne('https://192.168.0.113:5000/peaked/walls/1/versions/3/holds-plus');
    req.flush({ data: mockHolds, success: true, message: 'Success' });

    expect(component).toBeTruthy();
  });

  it('should fetch holds from API on init', () => {
    fixture.componentRef.setInput('wallId', 1);
    fixture.componentRef.setInput('versionId', 3);
    fixture.componentRef.setInput('modelUrl', 'https://test.com/model.glb');
    fixture.detectChanges();

    const req = httpMock.expectOne('https://192.168.0.113:5000/peaked/walls/1/versions/3/holds-plus');
    expect(req.request.method).toBe('GET');
    
    req.flush({ data: mockHolds, success: true, message: 'Success' });
  });

  it('should store fetched holds in signal', () => {
    fixture.componentRef.setInput('wallId', 1);
    fixture.componentRef.setInput('versionId', 3);
    fixture.componentRef.setInput('modelUrl', 'https://test.com/model.glb');
    fixture.detectChanges();

    const req = httpMock.expectOne('https://192.168.0.113:5000/peaked/walls/1/versions/3/holds-plus');
    req.flush({ data: mockHolds, success: true, message: 'Success' });

    expect(component.holds()).toEqual(mockHolds);
  });

  it('should set loading state while fetching', () => {
    fixture.componentRef.setInput('wallId', 1);
    fixture.componentRef.setInput('versionId', 3);
    fixture.componentRef.setInput('modelUrl', 'https://test.com/model.glb');
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);

    const req = httpMock.expectOne('https://192.168.0.113:5000/peaked/walls/1/versions/3/holds-plus');
    req.flush({ data: mockHolds, success: true, message: 'Success' });

    expect(component.isLoading()).toBe(false);
  });

  it('should handle API errors', () => {
    fixture.componentRef.setInput('wallId', 1);
    fixture.componentRef.setInput('versionId', 3);
    fixture.componentRef.setInput('modelUrl', 'https://test.com/model.glb');
    fixture.detectChanges();

    const req = httpMock.expectOne('https://192.168.0.113:5000/peaked/walls/1/versions/3/holds-plus');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(component.error()).toBeTruthy();
    expect(component.isLoading()).toBe(false);
  });

  describe('hold click interaction', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('wallId', 1);
      fixture.componentRef.setInput('versionId', 3);
      fixture.componentRef.setInput('modelUrl', 'https://test.com/model.glb');
      fixture.detectChanges();

      const req = httpMock.expectOne('https://192.168.0.113:5000/peaked/walls/1/versions/3/holds-plus');
      req.flush({ data: mockHolds, success: true, message: 'Success' });
    });

    it('should forward click to EditorService.handleHoldClick', () => {
      component.onHoldClick(7);
      expect(mockEditorService.handleHoldClick).toHaveBeenCalledWith(7);
    });

    it('should emit holdClicked event when hold is clicked', () => {
      const emitSpy = spyOn(component.holdClicked, 'emit');
      
      component.onHoldClick(7);
      
      expect(emitSpy).toHaveBeenCalledWith(7);
    });
  });

  describe('hold selection styling', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('wallId', 1);
      fixture.componentRef.setInput('versionId', 3);
      fixture.componentRef.setInput('modelUrl', 'https://test.com/model.glb');
      fixture.detectChanges();

      const req = httpMock.expectOne('https://192.168.0.113:5000/peaked/walls/1/versions/3/holds-plus');
      req.flush({ data: mockHolds, success: true, message: 'Success' });
    });

    it('should return true for isHoldSelected when hold is in selectedHoldIds', () => {
      // Set selected hold IDs in the mock store
      (mockEditorStore.selectedHoldIds as any).set(new Set([7]));
      
      expect(component.isHoldSelected(7)).toBeTrue();
      expect(component.isHoldSelected(8)).toBeFalse();
    });

    it('should return selected color for selected holds', () => {
      (mockEditorStore.selectedHoldIds as any).set(new Set([7]));
      
      expect(component.getHoldColor(7)).toBe('#ffcc00'); // Selected color (gold/yellow)
      expect(component.getHoldColor(8)).toBe('#00ff00'); // Default color
    });

    it('should use custom holdColor input for unselected holds', () => {
      fixture.componentRef.setInput('holdColor', '#ff0000');
      (mockEditorStore.selectedHoldIds as any).set(new Set([7]));
      
      expect(component.getHoldColor(7)).toBe('#ffcc00'); // Selected color overrides
      expect(component.getHoldColor(8)).toBe('#ff0000'); // Uses input color
    });
  });
});

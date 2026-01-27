import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HoldLoaderComponent } from './hold-loader.component';
import { Hold } from '../../../data-contracts/hold.model';

describe('HoldLoaderComponent', () => {
  let component: HoldLoaderComponent;
  let fixture: ComponentFixture<HoldLoaderComponent>;
  let httpMock: HttpTestingController;

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
    await TestBed.configureTestingModule({
      imports: [HoldLoaderComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
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
});

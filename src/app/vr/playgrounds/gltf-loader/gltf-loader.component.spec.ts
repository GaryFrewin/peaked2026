import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GltfLoaderComponent } from './gltf-loader.component';

describe('GltfLoaderComponent', () => {
  let component: GltfLoaderComponent;
  let fixture: ComponentFixture<GltfLoaderComponent>;
  const testUrl = 'https://garyfrewin.co.uk/sites/ClimbingData/3Dmodels/TheGarageV3.gltf';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GltfLoaderComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(GltfLoaderComponent);
    component = fixture.componentInstance;
    
    // Set required input before detectChanges
    fixture.componentRef.setInput('modelUrl', testUrl);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the GLTF model URL on the entity element', () => {
    // Then the entity should have gltf-model attribute with the URL
    const modelEntity = fixture.nativeElement.querySelector('#loaded-model');
    const gltfAttr = modelEntity.getAttribute('gltf-model');
    expect(gltfAttr).toBe(`url(${testUrl})`);
  });
});

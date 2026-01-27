import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HoldRendererComponent } from './hold-renderer';
import { Hold } from '../../../data-contracts/hold.model';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('HoldRendererComponent', () => {
  let component: HoldRendererComponent;
  let fixture: ComponentFixture<HoldRendererComponent>;

  const mockHolds: Hold[] = [
    {
      id: 1,
      wall_version_id: 456,
      x: 0,
      y: 1,
      z: 0,
      usage_count: 5,
      date_created: '2026-01-01T00:00:00Z',
      date_modified: '2026-01-01T00:00:00Z'
    },
    {
      id: 2,
      wall_version_id: 456,
      x: 1.5,
      y: 2.0,
      z: 0.5,
      usage_count: 3,
      date_created: '2026-01-01T00:00:00Z',
      date_modified: '2026-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoldRendererComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HoldRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept holds as signal input', () => {
    fixture.componentRef.setInput('holds', mockHolds);
    expect(component.holds()).toEqual(mockHolds);
  });

  it('should render correct number of hold entities', () => {
    fixture.componentRef.setInput('holds', mockHolds);
    fixture.detectChanges();

    const entities = fixture.nativeElement.querySelectorAll('a-entity');
    expect(entities.length).toBe(2);
  });

  it('should position entities using hold coordinates', () => {
    fixture.componentRef.setInput('holds', mockHolds);
    fixture.detectChanges();

    const firstEntity = fixture.nativeElement.querySelector('a-entity');
    const position = firstEntity.getAttribute('position');
    
    expect(position).toBe('0 1 0');
  });

  it('should handle empty holds array', () => {
    fixture.componentRef.setInput('holds', []);
    fixture.detectChanges();

    const entities = fixture.nativeElement.querySelectorAll('a-entity');
    expect(entities.length).toBe(0);
  });

  it('should update when holds input changes', () => {
    fixture.componentRef.setInput('holds', mockHolds);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a-entity').length).toBe(2);

    fixture.componentRef.setInput('holds', [mockHolds[0]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a-entity').length).toBe(1);
  });
});

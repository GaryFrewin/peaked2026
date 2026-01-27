# Peaked 2026 Refactoring Agent

## Purpose

You are a refactoring specialist helping migrate code from **peaked** (Angular 18) to **peaked2026** (Angular 20+). Use **modality-viewer** as a reference for best practices when applicable.

## Repository Context

| Repo | Version | Role |
|------|---------|------|
| `d:\deployed_projects\angular\peaked` | Angular 18 | **SOURCE** - Old codebase to migrate from |
| `d:\deployed_projects\angular\peaked2026` | Angular 20 | **TARGET** - New codebase to migrate to |
| `d:\deployed_projects\angular\modality-viewer` | Angular 20 | **REFERENCE** - Best practice patterns |

## Migration Goals

- Move to Angular 20, signal-based architecture
- Move to new A-Frame version 1.7
- Add comprehensive unit tests
- Clean up and simplify the codebase

---

## Key Architectural Differences

### Angular 18 (peaked) → Angular 20 (peaked2026)

| Old Pattern (peaked) | New Pattern (peaked2026) |
|---------------------|--------------------------|
| `BehaviorSubject` / `Observable` | `signal()` / `computed()` |
| Constructor injection | `inject()` function |
| `*ngIf`, `*ngFor`, `*ngSwitch` | `@if`, `@for`, `@switch` |
| `ngClass`, `ngStyle` | `[class]`, `[style]` bindings |
| `@Input()`, `@Output()` decorators | `input()`, `output()` signals |
| `@HostBinding`, `@HostListener` | `host: {}` in decorator |
| `standalone: true` explicit | `standalone: true` explicit  |
| `NgIf`, `AsyncPipe` imports | Native control flow (no imports) |

### Folder Structure Mapping

```
peaked/src/app/                    peaked2026/src/app/
├── aframe-components/             ├── vr/
│   ├── behaviours/                │   ├── playgrounds/
│   └── main-canvas/               │   ├── behaviours/     (to create)
├── pages/                         │   ├── scenes/         (to create)
├── services/                      │   ├── pages/          (to create)
├── components/                    │   └── components/     (to create)
├── directives/                    ├── desktop/
└── games/                         │   ├── pages/          (to create)
                                   │   └── components/     (to create)
                                   └── shared/
                                   |   ├── services/       (to create)
                                   |   └── stores/         (to create)
                                   ├──data-access/    (to create)
                                   ├──data-contracts/ (to create)
```

---

## STEPS

### Phase 1: Prove Basics

In individual playground scripts prove we can do things like:
- Load the GLTF from the remote source just like Peaked Main Canvas does (or even better, in an improved cleaner way).
- Work with HTTPS
- Prove we can do basic A-Frame things like run unit tests on components, create simple scenes, load assets, etc.

### Phase 2: Understand the Domain

We need to know:
- Backend endpoints and what data structures we need
- Do they need rich domain methods in the front end?
- What can we model and test using TDD that we don't even need the GUI for yet?

### Phase 3: Migrate Core Services

1. **XRService** - VR session management (`peaked/src/app/services/xr.service.ts`)
2. **AppStateService** - Application state (`peaked/src/app/services/app-state.service.ts`)
3. **SettingsService** - User preferences (`peaked/src/app/services/settings.service.ts`)

### Phase 4: Migrate A-Frame Components

1. **Main Canvas** - Primary VR scene (`peaked/src/app/aframe-components/main-canvas/`)
2. **Behaviours** - A-Frame custom components (`peaked/src/app/aframe-components/behaviours/`)

### Phase 5: Migrate Pages

1. **HomePage** - Entry point
2. **ViewerPage** - Main climbing wall viewer
3. **Game pages** - Interactive features

---

## Refactoring Patterns

### RxJS → Signals Conversion

```typescript
// OLD (peaked)
private stateSubject = new BehaviorSubject<AppState>(AppState.Standard);
public activeState$: Observable<AppState> = this.stateSubject.asObservable();

switchState(newState: AppState) {
  this.stateSubject.next(newState);
}

// NEW (peaked2026)
readonly activeState = signal<AppState>(AppState.Standard);

switchState(newState: AppState) {
  this.activeState.set(newState);
}
```

### Template Control Flow Conversion

```html
<!-- OLD (peaked) -->
<div *ngIf="isLoading$ | async">Loading...</div>
<div *ngFor="let item of items$ | async">{{ item.name }}</div>

<!-- NEW (peaked2026) -->
@if (isLoading()) {
  <div>Loading...</div>
}
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

### Input/Output Conversion

```typescript
// OLD (peaked)
@Input() wallId!: string;
@Output() wallSelected = new EventEmitter<string>();

// NEW (peaked2026)
readonly wallId = input.required<string>();
readonly wallSelected = output<string>();
```

### Modern Component Structure

```typescript
import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';

@Component({
  selector: 'app-feature-name',
  templateUrl: './feature-name.component.html',
  styleUrl: './feature-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true // always for ide type clarity
})
export class FeatureNameComponent {
  // Use inject() instead of constructor injection
  private readonly myService = inject(MyService);
  
  // Use signals for state
  protected readonly isLoading = signal(false);
  protected readonly data = signal<DataType | null>(null);
  
  // Use computed() for derived state
  protected readonly hasData = computed(() => this.data() !== null);
}
```

---

## A-Frame Integration Guidelines

A-Frame components require special handling:

```typescript
import { 
  Component, 
  CUSTOM_ELEMENTS_SCHEMA, 
  AfterViewInit,
  ChangeDetectionStrategy,
  signal 
} from '@angular/core';

// Import A-Frame BEFORE component
import 'aframe';

declare var AFRAME: any;

@Component({
  selector: 'app-vr-scene',
  templateUrl: './vr-scene.component.html',
  styleUrl: './vr-scene.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Required for a-* elements
})
export class VrSceneComponent implements AfterViewInit {
  protected readonly sceneLoaded = signal(false);
  protected readonly vrSupported = signal(false);

  ngAfterViewInit(): void {
    // Access A-Frame after view init
    const scene = document.querySelector('a-scene');
    if (scene) {
      if ((scene as any).hasLoaded) {
        this.onSceneLoaded();
      } else {
        scene.addEventListener('loaded', () => this.onSceneLoaded(), { once: true });
      }
    }
  }

  private onSceneLoaded(): void {
    this.sceneLoaded.set(true);
  }
}
```

---

## Store Pattern (from modality-viewer)

For complex state management, use signal stores:

```typescript
import { inject, Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WallStore {
  private api = inject(WallApi);

  // State signals
  readonly walls = signal<Wall[]>([]);
  readonly selectedWallId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  
  // Computed values
  readonly selectedWall = computed(() => {
    const id = this.selectedWallId();
    return id ? this.walls().find(w => w.id === id) ?? null : null;
  });

  // Actions with guards (from modality-viewer pattern)
  loadWalls(): void {
    // Guard: Skip if already loading
    if (this.isLoading()) return;
    
    this.isLoading.set(true);
    this.error.set(null);
    
    this.api.getWalls().subscribe({
      next: (walls) => {
        this.walls.set(walls);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  selectWall(id: string): void {
    this.selectedWallId.set(id);
  }

  clear(): void {
    this.walls.set([]);
    this.selectedWallId.set(null);
    this.isLoading.set(false);
    this.error.set(null);
  }
}
```

---

## Common Migration Commands

```bash
# Generate new component in peaked2026
cd d:\deployed_projects\angular\peaked2026
ng generate component vr/scenes/main-scene --change-detection OnPush

# Generate service
ng generate service shared/services/xr

# Generate store
ng generate service shared/stores/wall-store
```

---

## Checklist for Each Migration

- [ ] Source file identified in `peaked`
- [ ] Dependencies mapped
- [ ] Target location determined in `peaked2026`
- [ ] BehaviorSubject → signal() converted
- [ ] Observable subscriptions → signal/computed converted
- [ ] Template directives → control flow converted
- [ ] @Input/@Output → input()/output() converted
- [ ] Constructor injection → inject() converted
- [ ] OnPush change detection added
- [ ] CUSTOM_ELEMENTS_SCHEMA added (if A-Frame)
- [ ] Tests written/updated

---

## Reference Files

When stuck, consult these exemplary files:

### peaked2026 (current state)
- [app.ts](../../src/app/app.ts) - Root component pattern
- [basic-scene.component.ts](../../src/app/vr/playgrounds/basic-scene/basic-scene.component.ts) - A-Frame integration

### modality-viewer (best practices)
- `modality-viewer/src/app/stores/dmr-report.store.ts` - Signal store pattern
- `modality-viewer/src/app/app.ts` - Root component
- `modality-viewer/.github/copilot-instructions.md` - Comprehensive patterns

### peaked (source to migrate)
- `peaked/src/app/services/xr.service.ts` - XR service (needs signals)
- `peaked/src/app/services/app-state.service.ts` - State management (needs signals)
- `peaked/src/app/aframe-components/main-canvas/` - Main VR component
- `peaked/src/app/aframe-components/behaviours/` - All A-Frame custom components

---

## Key Peaked Behaviours to Migrate

These A-Frame behaviours from `peaked/src/app/aframe-components/behaviours/` need migration:

| Behaviour | Purpose | Priority |
|-----------|---------|----------|
| `calibration/` | AR/VR calibration | High |
| `controller-gui/` | VR controller UI | High |
| `hand-collider/` | Hand physics | High |
| `hold-container/` | Climbing holds | High |
| `route-hold-container/` | Route management | High |
| `wall-model-loader/` | GLTF loading | High |
| `skybox/` | Environment | Medium |
| `wrist-panel/` | VR UI | Medium |
| `games/` | Game logic | Low |

---

## Testing Strategy

Follow modality-viewer patterns for testing:

```typescript
// Component test setup
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  let mockStore: jasmine.SpyObj<FeatureStore>;

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('FeatureStore', ['loadData', 'clear'], {
      data: signal(null),
      isLoading: signal(false),
      error: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [FeatureComponent],
      providers: [
        { provide: FeatureStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```


YOU MUST WORK TDD. 
YOu suggest tests first, THEN THE USER APPROVES 
then implementation THEN USER APPROVES
then COMMIT with clear message.
REPEAT until done. 
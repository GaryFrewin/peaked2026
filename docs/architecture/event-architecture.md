Two full flows:

---

## Flow 1: Hold Clicked

**Scenario A: View mode** → Show hold details panel
**Scenario B: EditHolds mode** → Select/deselect the hold

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. A-FRAME DOM EVENT                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User clicks on <a-sphere class="hold" data-hold-id="42">                   │
│                           │                                                 │
│                           ▼                                                 │
│  ┌─────────────────────────────────────────┐                                │
│  │ desktop-interaction-manager             │                                │
│  │                                         │                                │
│  │ this.el.addEventListener('click', e => {│                                │
│  │   if (e.target.classList.contains('hold')) {                             │
│  │     const id = +e.target.dataset.holdId;│                                │
│  │     window.peakedBus.emitHoldClicked(id);                                │
│  │   }                                     │                                │
│  │ });                                     │                                │
│  └─────────────────────────────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. INTERACTION BUS (Angular Service)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  @Injectable({ providedIn: 'root' })                                        │
│  class InteractionBus {                                                     │
│    private holdClicked$ = new Subject<number>();                            │
│    readonly onHoldClicked = this.holdClicked$.asObservable();               │
│                                                                             │
│    emitHoldClicked(id: number) {                                            │
│      this.holdClicked$.next(id);  // ← called from window.peakedBus         │
│    }                                                                        │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. INTERACTION HANDLER (Routes to correct ModeHandler)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  class InteractionHandler {                                                 │
│    private handlers = new Map<EditorMode, ModeHandler>([...]);              │
│                                                                             │
│    constructor() {                                                          │
│      this.bus.onHoldClicked.subscribe(id => {                               │
│        this.handlers.get(this.editorStore.mode())?.onHoldClicked?.(id);     │
│      });                                       │                            │
│    }                                           │                            │
│  }                                             │                            │
│                                                │                            │
└────────────────────────────────────────────────┼────────────────────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────┐
                     │                                                   │
                     ▼ mode === 'view'                                   ▼ mode === 'editHolds'
┌────────────────────────────────────────┐     ┌─────────────────────────────────────────────┐
│ 4A. VIEW MODE HANDLER                  │     │ 4B. EDIT HOLDS MODE HANDLER                 │
├────────────────────────────────────────┤     ├─────────────────────────────────────────────┤
│                                        │     │                                             │
│ class ViewModeHandler {                │     │ class EditHoldsModeHandler {                │
│   holdStore = inject(HoldStore);       │     │   editorStore = inject(EditorStore);        │
│                                        │     │                                             │
│   onHoldClicked(id: number) {          │     │   onHoldClicked(id: number) {               │
│     this.holdStore.selectForDetails(id);     │     this.editorStore.toggleHoldSelection(id);│
│   }                                    │     │   }                                         │
│ }                                      │     │ }                                           │
│                                        │     │                                             │
└───────────────────┬────────────────────┘     └──────────────────────┬──────────────────────┘
                    │                                                 │
                    ▼                                                 ▼
┌────────────────────────────────────────┐     ┌─────────────────────────────────────────────┐
│ 5A. HOLD STORE                         │     │ 5B. EDITOR STORE                            │
├────────────────────────────────────────┤     ├─────────────────────────────────────────────┤
│                                        │     │                                             │
│ selectedHoldId = signal<number|null>();│     │ selectedHoldIds = signal<Set<number>>();    │
│                                        │     │                                             │
│ selectForDetails(id: number) {         │     │ toggleHoldSelection(id: number) {           │
│   this.selectedHoldId.set(id);         │     │   this.selectedHoldIds.update(set => {      │
│ }                                      │     │     const next = new Set(set);              │
│                                        │     │     next.has(id) ? next.delete(id)          │
│                                        │     │                  : next.add(id);            │
│                                        │     │     return next;                            │
│                                        │     │   });                                       │
│                                        │     │ }                                           │
└───────────────────┬────────────────────┘     └──────────────────────┬──────────────────────┘
                    │                                                 │
                    ▼                                                 ▼
┌────────────────────────────────────────┐     ┌─────────────────────────────────────────────┐
│ 6A. UI REACTS (Details Panel)          │     │ 6B. UI REACTS (Hold highlight + A-Frame)    │
├────────────────────────────────────────┤     ├─────────────────────────────────────────────┤
│                                        │     │                                             │
│ <hold-details-panel>                   │     │ BaseScene template:                         │
│   @if (holdStore.selectedHoldId()) {   │     │                                             │
│     <h2>{{ hold().name }}</h2>         │     │ [attr.material]="editorStore               │
│     <p>Type: {{ hold().type }}</p>     │     │   .selectedHoldIds().has(hold.id)           │
│   }                                    │     │   ? 'color: yellow; emissive: yellow'       │
│ </hold-details-panel>                  │     │   : 'color: white'"                         │
│                                        │     │                                             │
└────────────────────────────────────────┘     └─────────────────────────────────────────────┘
```

---

## Flow 2: Wall Clicked (empty space on wall)

**Scenario A: View mode** → Nothing happens
**Scenario B: EditHolds mode** → Create new hold at click point

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. A-FRAME DOM EVENT                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User clicks on <a-entity class="wall" id="garage">                         │
│  Raycaster provides intersection point: {x: 0.5, y: 1.2, z: 0.1}            │
│                           │                                                 │
│                           ▼                                                 │
│  ┌─────────────────────────────────────────┐                                │
│  │ desktop-interaction-manager             │                                │
│  │                                         │                                │
│  │ this.el.addEventListener('click', e => {│                                │
│  │   if (e.target.classList.contains('wall')) {                             │
│  │     const point = e.detail.intersection.point;                           │
│  │     window.peakedBus.emitWallClicked(point);                             │
│  │   }                                     │                                │
│  │ });                                     │                                │
│  └─────────────────────────────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. INTERACTION BUS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  private wallClicked$ = new Subject<Point3D>();                             │
│  readonly onWallClicked = this.wallClicked$.asObservable();                 │
│                                                                             │
│  emitWallClicked(point: Point3D) {                                          │
│    this.wallClicked$.next(point);                                           │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. INTERACTION HANDLER                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  this.bus.onWallClicked.subscribe(point => {                                │
│    this.handlers.get(this.editorStore.mode())?.onWallClicked?.(point);      │
│  });                                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                     ┌──────────────┴───────────────────────┐
                     │                                      │
                     ▼ mode === 'view'                      ▼ mode === 'editHolds'
┌────────────────────────────────────────┐     ┌─────────────────────────────────────────────┐
│ 4A. VIEW MODE HANDLER                  │     │ 4B. EDIT HOLDS MODE HANDLER                 │
├────────────────────────────────────────┤     ├─────────────────────────────────────────────┤
│                                        │     │                                             │
│ // Method not implemented or empty     │     │ class EditHoldsModeHandler {                │
│ // Wall clicks do nothing in view mode │     │   holdApi = inject(HoldApi);                │
│                                        │     │   holdStore = inject(HoldStore);            │
│                                        │     │   wallStore = inject(WallStore);            │
│                                        │     │                                             │
│                                        │     │   onWallClicked(point: Point3D) {           │
│                                        │     │     const versionId = this.wallStore        │
│                                        │     │       .selectedVersionId();                 │
│                                        │     │     this.holdApi.createHold(versionId, point)│
│                                        │     │       .subscribe(newHold => {               │
│                                        │     │         this.holdStore.addHold(newHold);    │
│                                        │     │       });                                   │
│                                        │     │   }                                         │
│                                        │     │ }                                           │
│                                        │     │                                             │
└────────────────────────────────────────┘     └──────────────────────┬──────────────────────┘
                                                                      │
                                                                      ▼
                                              ┌─────────────────────────────────────────────┐
                                              │ 5. HOLD API (HTTP call)                     │
                                              ├─────────────────────────────────────────────┤
                                              │                                             │
                                              │ createHold(versionId, point): Observable<Hold> {│
                                              │   return this.http.post('/api/holds', {     │
                                              │     wall_version_id: versionId,             │
                                              │     x: point.x, y: point.y, z: point.z      │
                                              │   });                                       │
                                              │ }                                           │
                                              │                                             │
                                              └──────────────────────┬──────────────────────┘
                                                                     │
                                                                     ▼
                                              ┌─────────────────────────────────────────────┐
                                              │ 6. HOLD STORE (updates signal)              │
                                              ├─────────────────────────────────────────────┤
                                              │                                             │
                                              │ addHold(hold: Hold) {                       │
                                              │   this.holds.update(list => [...list, hold]);│
                                              │ }                                           │
                                              │                                             │
                                              └──────────────────────┬──────────────────────┘
                                                                     │
                                                                     ▼
                                              ┌─────────────────────────────────────────────┐
                                              │ 7. UI REACTS (new sphere appears)           │
                                              ├─────────────────────────────────────────────┤
                                              │                                             │
                                              │ BaseScene template:                         │
                                              │                                             │
                                              │ @for (hold of holdStore.holds(); track hold.id) {│
                                              │   <a-sphere [attr.position]="...">          │
                                              │ }                                           │
                                              │                                             │
                                              │ Signal update → Angular re-renders →        │
                                              │ New sphere appears in A-Frame scene         │
                                              │                                             │
                                              └─────────────────────────────────────────────┘
```

---

**Summary of the pieces:**

| Layer | Responsibility |
|-------|----------------|
| `desktop-interaction-manager` | Captures DOM events, extracts data, emits to bus |
| `InteractionBus` | Bridges A-Frame world to Angular world |
| `InteractionHandler` | Routes events to current mode's handler |
| `ModeHandler` (per mode) | Decides what action to take, calls stores/APIs |
| `Stores` | Hold state, expose signals |
| `UI Components` | React to signal changes, render |

Does this match your mental model? Ready to write tests?

Good thinking. Let's trace 3 real use cases:

---

## Use Case 1: View Mode - Hover Hold → Show Tooltip

**Goal:** When hovering a hold in view mode, show a tooltip with hold info.

```
┌─────────────────────────────────────────────────────────────────┐
│ InteractionBus.holdHovered$ emits holdId: 42                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ InteractionHandler subscribes, checks mode                      │
│                                                                 │
│ if (mode === 'view') {                                          │
│   this.holdStore.setHoveredHold(holdId);  ← calls store action  │
│ }                                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ HoldStore                                                       │
│                                                                 │
│ readonly hoveredHoldId = signal<number | null>(null);  ← SIGNAL │
│                                                                 │
│ setHoveredHold(id: number | null) {                             │
│   this.hoveredHoldId.set(id);                                   │
│ }                                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ HoldTooltipComponent (reads signal, Angular re-renders)         │
│                                                                 │
│ holdStore = inject(HoldStore);                                  │
│ hoveredHold = computed(() => {                                  │
│   const id = this.holdStore.hoveredHoldId();                    │
│   return this.holdStore.holds().find(h => h.id === id);         │
│ });                                                             │
│                                                                 │
│ Template:                                                       │
│ @if (hoveredHold()) {                                           │
│   <div class="tooltip">{{ hoveredHold().name }}</div>           │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** Observable (bus) → Store method → Signal → UI via computed

---

## Use Case 2: EditHolds Mode - Click Hold → Toggle Selection

**Goal:** In editHolds mode, clicking a hold selects/deselects it (yellow highlight).

```
┌─────────────────────────────────────────────────────────────────┐
│ InteractionBus.holdClicked$ emits holdId: 42                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ InteractionHandler                                              │
│                                                                 │
│ if (mode === 'editHolds') {                                     │
│   this.editorStore.toggleHoldSelection(holdId);                 │
│ }                                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ EditorStore (already exists!)                                   │
│                                                                 │
│ readonly selectedHoldIds = signal<Set<number>>(new Set());      │
│                                                                 │
│ toggleHoldSelection(holdId: number) {                           │
│   this.selectedHoldIds.update(set => {                          │
│     const next = new Set(set);                                  │
│     next.has(holdId) ? next.delete(holdId) : next.add(holdId);  │
│     return next;                                                │
│   });                                                           │
│ }                                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ BaseScene template (reads signal for hold material)             │
│                                                                 │
│ editorStore = inject(EditorStore);                              │
│                                                                 │
│ getHoldMaterial(holdId: number): string {                       │
│   return this.editorStore.selectedHoldIds().has(holdId)         │
│     ? 'color: yellow; emissive: yellow'                         │
│     : 'color: white';                                           │
│ }                                                               │
│                                                                 │
│ Template:                                                       │
│ <a-sphere [attr.material]="getHoldMaterial(hold.id)" />         │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** Same pattern - Observable → Store signal → UI binds to signal

---

## Use Case 3: EditHolds Mode - Click Wall → Create New Hold (API call)

**Goal:** Clicking empty wall space creates a new hold at that 3D position.

```
┌─────────────────────────────────────────────────────────────────┐
│ InteractionBus.wallClicked$ emits { x: 0.5, y: 1.2, z: 0.1 }    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ InteractionHandler                                              │
│                                                                 │
│ if (mode === 'editHolds') {                                     │
│   const versionId = this.wallStore.selectedVersionId();         │
│   this.holdStore.createHold(versionId, point);  ← async action  │
│ }                                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ HoldStore                                                       │
│                                                                 │
│ readonly holds = signal<Hold[]>([]);                            │
│ readonly isCreating = signal(false);                            │
│                                                                 │
│ createHold(versionId: number, point: Point3D) {                 │
│   this.isCreating.set(true);                                    │
│                                                                 │
│   this.holdApi.createHold(versionId, point).subscribe({         │
│     next: (newHold) => {                                        │
│       this.holds.update(list => [...list, newHold]); ← SIGNAL   │
│       this.isCreating.set(false);                               │
│     },                                                          │
│     error: (err) => { ... }                                     │
│   });                                                           │
│ }                                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ BaseScene (holds signal updated → new sphere appears)           │
│                                                                 │
│ @for (hold of holdStore.holds(); track hold.id) {               │
│   <a-sphere [attr.position]="..." />                            │
│ }                                                               │
│                                                                 │
│ Angular sees signal changed → re-renders → new hold visible     │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** Observable → Store does async work → Updates signal → UI reacts

---

## Summary: The Pattern

| Layer | Technology | Role |
|-------|------------|------|
| **A-Frame** | DOM events | Raw event capture |
| **InteractionBus** | RxJS Subject/Observable | Bridge to Angular |
| **InteractionHandler** | RxJS subscription + mode check | Route event to right action |
| **Stores** | Signals | Hold state, expose to UI |
| **Components** | Signal reads / computed | React to state changes |

**Observables** handle the event flow (async, one-time).  
**Signals** hold the resulting state (reactive, continuous).

---

Does this pattern make sense? Should we build the InteractionHandler next to prove out use case 1 or 2?
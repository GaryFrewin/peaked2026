# Persona

You are a dedicated Angular developer who thrives on leveraging the absolute latest features of the framework to build cutting-edge applications. You are currently immersed in Angular v20+, passionately adopting signals for reactive state management, embracing standalone components for streamlined architecture, and utilizing the new control flow for more intuitive template logic. Performance is paramount to you, who constantly seeks to optimize change detection and improve user experience through these modern Angular paradigms. When prompted, assume You are familiar with all the newest APIs and best practices, valuing clean, efficient, and maintainable code.


CUSTOM ELEMENT SCHEMA DOESN'T WORK WITHOUT STANDALONE TRUE
---
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],


## Examples

These are modern examples of how to write an Angular 20 component with signals

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';


@Component({
  selector: '{{tag-name}}-root',
  templateUrl: '{{tag-name}}.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class {{ClassName}} {
  protected readonly isServerRunning = signal(true);
  toggleServerStatus() {
    this.isServerRunning.update(isServerRunning => !isServerRunning);
  }
}
```

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;

  button {
    margin-top: 10px;
  }
}
```

```html
<section class="container">
  @if (isServerRunning()) {
  <span>Yes, the server is running</span>
  } @else {
  <span>No, the server is not running</span>
  }
  <button (click)="toggleServerStatus()">Toggle Server Status</button>
</section>
```

When you update a component, be sure to put the logic in the ts file, the styles in the css file and the html template in the html file.

## Resources

Here are some links to the essentials for building Angular applications. Use these to get an understanding of how some of the core functionality works
https://angular.dev/essentials/components
https://angular.dev/essentials/signals
https://angular.dev/essentials/templates
https://angular.dev/essentials/dependency-injection

## Best practices & Style guide

Here are the best practices and the style guide information.

### Coding Style guide

Here is a link to the most recent Angular style guide https://angular.dev/style-guide

### TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

### Angular Best Practices

- Always use standalone components over `NgModules`
- Do NOT set `standalone: true` inside the `@Component`, `@Directive` and `@Pipe` decorators
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

### Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` signal instead of decorators, learn more here https://angular.dev/guide/components/inputs
- Use `output()` function instead of decorators, learn more here https://angular.dev/guide/components/outputs
- Use `computed()` for derived state learn more about signals here https://angular.dev/guide/signals.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead, for context: https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings
- Do NOT use `ngStyle`, use `style` bindings instead, for context: https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).
- Use the async pipe to handle observables
- Use built in pipes and import pipes when being used in a template, learn more https://angular.dev/guide/templates/pipes#
- When using external templates/styles, use paths relative to the component TS file.

### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

## A-Frame + Angular Integration

This app uses A-Frame 1.7 for VR/3D rendering. There are critical patterns to follow.

### CRITICAL: A-Frame Cannot See Inside Angular Components

**A-Frame entities MUST be rendered directly in the template containing `<a-scene>`.**

A-Frame builds its scene graph from the DOM. Angular components create their own DOM boundaries that A-Frame cannot traverse. If you wrap A-Frame entities in an Angular component, A-Frame won't find them.

❌ **WRONG** - A-Frame won't see these entities:
```html
<!-- base-scene.html -->
<a-scene>
  <app-hold-renderer [holds]="holds()" />  <!-- A-Frame can't see inside this! -->
</a-scene>
```

✅ **CORRECT** - Render entities directly:
```html
<!-- base-scene.html -->
<a-scene>
  @for (hold of holds(); track hold.id) {
    <a-sphere
      [attr.position]="hold.x + ' ' + hold.y + ' ' + hold.z"
      radius="0.05"
      color="#00ff00">
    </a-sphere>
  }
</a-scene>
```

### A-Frame Attribute Binding

Use `[attr.X]` for dynamic A-Frame attributes:

```html
<!-- Dynamic position -->
<a-entity [attr.position]="x + ' ' + y + ' ' + z"></a-entity>

<!-- Dynamic gltf-model with url() wrapper -->
<a-entity [attr.gltf-model]="'url(' + modelUrl() + ')'"></a-entity>

<!-- Static attributes work normally -->
<a-sphere radius="0.05" color="#00ff00"></a-sphere>
```

### Required Schema for A-Frame Components

Any component using A-Frame elements needs `CUSTOM_ELEMENTS_SCHEMA`:

```typescript
@Component({
  selector: 'app-vr-scene',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // Required for <a-scene>, <a-entity>, etc.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### Scene Ready Pattern

A-Frame scenes load asynchronously. Use the `loaded` event:

```typescript
@ViewChild('scene', { static: false }) sceneElement!: ElementRef<HTMLElement>;

ngAfterViewInit(): void {
  const scene = this.sceneElement.nativeElement;
  scene.addEventListener('loaded', () => {
    // Scene is ready - safe to query entities, start game logic, etc.
  }, { once: true });
}
```

### Asset Loading

For GLTF/GLB models, use direct URL loading (not the asset system):

```html
<!-- Direct URL loading - works reliably with Angular's change detection -->
<a-entity [attr.gltf-model]="'url(' + modelUrl() + ')'"></a-entity>
```

### 3D Assets Are Not Tracked in Git

GLTF, GLB, and other 3D assets are served from remote URLs in production (e.g., `https://garyfrewin.co.uk/sites/ClimbingData/3Dmodels/`). For local development, copy assets to `public/assets/` but they are gitignored.

---

## COMMITING
ALwats write clear commit messages that explain the "why" behind the change, not just the "what".
Always use git status first to see what files have changed. Never use git add . or git add -A to add all files.
When committing, only commit the files that are relevant to the change you made. Do not commit unrelated files.
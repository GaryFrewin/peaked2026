import { Injectable } from '@angular/core';
import { BaseSceneComponent } from '../../shared/components/base-scene/base-scene';
import { registerDesktopInteractionManager } from '../../vr/behaviours/desktop-interaction-manager';

/**
 * DESKTOP SCENE APPLIER
 *
 * One-time setup of desktop-mode A-Frame DOM:
 * - Mouse cursor entity (enables mouseenter/mouseleave raycasting)
 * - Desktop interaction manager (captures click/drag/hover on holds/walls)
 *
 * Called once after scene ready. Not reactive - just initial DOM creation.
 * Compare to DesktopSettingsApplier which uses effects for reactive updates.
 *
 * Usage: this.sceneApplier.attachTo(this.baseScene);
 */
@Injectable({ providedIn: 'root' })
export class DesktopSceneApplier {
  
  /**
   * Attach all desktop-specific setup to a BaseScene.
   * Call once after scene is ready.
   */
  attachTo(scene: BaseSceneComponent): void {
    this.attachInteractionManager(scene);
    this.attachMouseCursor(scene);
  }

  /**
   * Attach desktop-interaction-manager behavior to wall-environment.
   * This enables mouse event capture (click, hover, drag) on holds and walls.
   */
  private attachInteractionManager(scene: BaseSceneComponent): void {
    // Ensure component is registered BEFORE trying to attach it
    registerDesktopInteractionManager();
    
    const wallEnvironment = scene.sceneElement.nativeElement.querySelector('#wall-environment');
    if (wallEnvironment) {
      wallEnvironment.setAttribute('desktop-interaction-manager', '');
      console.log('Desktop interaction manager attached to wall-environment');
    } else {
      console.warn('wall-environment entity not found for desktop interaction manager');
    }
  }

  /**
   * Create and attach mouse cursor entity for desktop raycasting.
   * Enables mouseenter/mouseleave events on interactable entities.
   */
  private attachMouseCursor(scene: BaseSceneComponent): void {
    // scene.sceneElement.nativeElement IS the <a-scene> element
    const sceneEl = scene.sceneElement.nativeElement;
    
    const mouseCursor = document.createElement('a-entity');
    mouseCursor.setAttribute('id', 'mouseCursor');
    mouseCursor.setAttribute('cursor', 'rayOrigin: mouse; fuse: false');
    mouseCursor.setAttribute('raycaster', 'objects: .interactable, .hold, .wall; far: 100');
    sceneEl.appendChild(mouseCursor);
    console.log('Mouse cursor attached for raycasting');
  }
}

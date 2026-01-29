import { Injectable } from '@angular/core';
import { BaseSceneComponent } from '../../shared/components/base-scene/base-scene';

/**
 * VR SCENE APPLIER
 *
 * One-time setup of VR-mode A-Frame DOM:
 * - Camera rig with VR camera
 * - Left/Right laser controllers
 * - Left/Right hand tracking entities
 *
 * Called once after scene ready. Controllers and hands are created
 * programmatically because A-Frame can't see entities inside Angular
 * component boundaries (ng-content/slots with div wrappers).
 *
 * Usage: this.sceneApplier.attachTo(this.baseScene);
 */
@Injectable({ providedIn: 'root' })
export class VrSceneApplier {
  
  /**
   * Attach all VR-specific setup to a BaseScene.
   * Call once after scene is ready.
   */
  attachTo(scene: BaseSceneComponent): void {
    this.attachCameraRig(scene);
    this.attachControllers(scene);
    this.attachHandTracking(scene);
    this.attachAtmosphere(scene);
  }

  /**
   * Create VR camera rig programmatically.
   */
  private attachCameraRig(scene: BaseSceneComponent): void {
    const sceneEl = scene.sceneElement.nativeElement;
    
    // Remove any existing camera rig or default camera
    const existingRig = sceneEl.querySelector('#cameraRig');
    if (existingRig) {
      existingRig.remove();
    }
    
    const defaultCam = sceneEl.querySelector('[data-aframe-default-camera]');
    if (defaultCam) {
      defaultCam.remove();
    }

    // Create camera rig
    const cameraRig = document.createElement('a-entity');
    cameraRig.setAttribute('id', 'cameraRig');
    cameraRig.setAttribute('position', '0 0 0');

    // Create VR camera
    const camera = document.createElement('a-camera');
    camera.setAttribute('id', 'vrCamera');
    cameraRig.appendChild(camera);

    sceneEl.appendChild(cameraRig);
    console.log('[VrSceneApplier] Camera rig created');
  }

  /**
   * Create laser controllers for VR.
   * laser-controls automatically renders Oculus Touch / other controller models.
   */
  private attachControllers(scene: BaseSceneComponent): void {
    const sceneEl = scene.sceneElement.nativeElement;
    const cameraRig = sceneEl.querySelector('#cameraRig');
    
    if (!cameraRig) {
      console.warn('[VrSceneApplier] Camera rig not found for controllers');
      return;
    }

    // Left controller
    const leftController = document.createElement('a-entity');
    leftController.setAttribute('id', 'leftController');
    leftController.setAttribute('laser-controls', 'hand: left');
    leftController.setAttribute('raycaster', 'objects: .interactable, .hold; far: 10');
    cameraRig.appendChild(leftController);

    // Right controller
    const rightController = document.createElement('a-entity');
    rightController.setAttribute('id', 'rightController');
    rightController.setAttribute('laser-controls', 'hand: right');
    rightController.setAttribute('raycaster', 'objects: .interactable, .hold; far: 10');
    cameraRig.appendChild(rightController);

    console.log('[VrSceneApplier] Controllers attached (left + right)');
  }

  /**
   * Create hand tracking entities.
   * These go outside the camera rig per A-Frame best practices.
   * hand-tracking-controls automatically renders hand models when tracking is active.
   */
  private attachHandTracking(scene: BaseSceneComponent): void {
    const sceneEl = scene.sceneElement.nativeElement;

    // Left hand
    const leftHand = document.createElement('a-entity');
    leftHand.setAttribute('id', 'leftHand');
    leftHand.setAttribute('hand-tracking-controls', 'hand: left');
    sceneEl.appendChild(leftHand);

    // Right hand
    const rightHand = document.createElement('a-entity');
    rightHand.setAttribute('id', 'rightHand');
    rightHand.setAttribute('hand-tracking-controls', 'hand: right');
    sceneEl.appendChild(rightHand);

    console.log('[VrSceneApplier] Hand tracking entities attached');
  }

  /**
   * Create atmosphere container with particle effects.
   * Effects are modular - add/remove components here to change the vibe.
   */
  private attachAtmosphere(scene: BaseSceneComponent): void {
    const sceneEl = scene.sceneElement.nativeElement;

    // Container for all atmosphere effects
    const atmosphereContainer = document.createElement('a-entity');
    atmosphereContainer.setAttribute('id', 'atmosphere-container');
    atmosphereContainer.setAttribute('position', '0 0 0');

    // Floating dust particles - larger and brighter for visibility
    atmosphereContainer.setAttribute('floating-particles', 'count: 300; size: 0.015; spread: 10 6 10; opacity: 0.8; color: #ffff88');

    sceneEl.appendChild(atmosphereContainer);

    console.log('[VrSceneApplier] Atmosphere container attached');
  }
}

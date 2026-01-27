/**
 * Triangle Alignment A-Frame Component
 *
 * Given 3 real-world marker positions and 3 corresponding model marker positions,
 * computes the optimal transformation (translation + rotation + uniform scale)
 * that aligns the model markers to the real markers.
 *
 * Uses centroid-based alignment to distribute error evenly across all points.
 *
 * Usage:
 * ```html
 * <a-entity id="wall-container" triangle-align>
 *   <!-- GLTF model and markers -->
 * </a-entity>
 * ```
 *
 * Call the align() method with marker positions:
 * ```ts
 * const triangleAlign = wallContainer.components['triangle-align'];
 * triangleAlign.align(realPositions, modelPositions);
 * ```
 *
 * Events:
 * - alignment-complete: Fired when alignment finishes
 *   Detail: { position: Vector3, quaternion: Quaternion, scale: Vector3 }
 *
 * @ported-from peaked/src/app/pages/playground/playground-calibrate/triangle-align.ts
 */

declare const AFRAME: any;
declare const THREE: any;

export function registerTriangleAlignComponent(): void {
  if (typeof AFRAME === 'undefined') {
    console.warn('AFRAME not found, cannot register triangle-align component');
    return;
  }

  if (AFRAME.components['triangle-align']) {
    return; // Already registered
  }

  AFRAME.registerComponent('triangle-align', {
    schema: {
      // Whether to animate the transition (default false for instant alignment)
      animate: { type: 'boolean', default: false },
      animationDuration: { type: 'number', default: 500 },
    },

    init: function () {
      console.log('[triangle-align] Initialized on', this.el.id);
    },

    /**
     * Main alignment function - call this with the marker positions
     *
     * @param realPositions - Array of 3 THREE.Vector3 (world positions of real markers)
     * @param modelPositions - Array of 3 THREE.Vector3 (world positions of model markers)
     */
    align: function (realPositions: any[], modelPositions: any[]) {
      if (realPositions.length !== 3 || modelPositions.length !== 3) {
        console.error('[triangle-align] Need exactly 3 markers in each set');
        return;
      }

      const container = this.el.object3D;

      // Calculate the transformation
      const result = this.computeAlignment(realPositions, modelPositions, container);

      if (!result) {
        console.error('[triangle-align] Failed to compute alignment');
        return;
      }

      const { position, quaternion, scale } = result;

      if (this.data.animate) {
        // Animation will emit alignment-complete when done
        this.animateToTransform(position, quaternion, scale);
      } else {
        // Apply immediately
        container.position.copy(position);
        container.quaternion.copy(quaternion);
        container.scale.copy(scale);

        console.log('[triangle-align] Instant alignment complete');
        this.el.emit('alignment-complete', { position, quaternion, scale });
      }
    },

    /**
     * Build an orthonormal coordinate frame from 3 points
     * X axis: from p1 to p2 (normalized)
     * Z axis: perpendicular to the triangle plane
     * Y axis: completes the right-handed frame
     */
    buildOrthonormalFrame: function (p1: any, p2: any, p3: any) {
      const x = new THREE.Vector3().subVectors(p2, p1).normalize();
      const temp = new THREE.Vector3().subVectors(p3, p1);
      const z = new THREE.Vector3().crossVectors(x, temp).normalize();
      const y = new THREE.Vector3().crossVectors(z, x).normalize();

      return { x, y, z };
    },

    /**
     * Direct geometric alignment for 3 corresponding points.
     *
     * Uses CENTROID-based alignment to distribute error evenly across all points,
     * rather than anchoring on point 1.
     *
     * For identical triangles, this produces EXACT alignment (0 error on all points).
     * For different-shaped triangles, error is distributed evenly.
     */
    computeAlignment: function (real: any[], model: any[], container: any) {
      const n = real.length;

      // Log container's CURRENT transform
      console.log('[triangle-align] Container current transform:');
      console.log('  Position:', container.position.x.toFixed(4), container.position.y.toFixed(4), container.position.z.toFixed(4));
      console.log('  Scale:', container.scale.x.toFixed(4), container.scale.y.toFixed(4), container.scale.z.toFixed(4));

      // Get the LOCAL positions of model points (fixed positions relative to container)
      const modelLocal: any[] = [];
      for (let i = 0; i < n; i++) {
        modelLocal.push(container.worldToLocal(model[i].clone()));
      }

      console.log('[triangle-align] Model LOCAL positions:');
      modelLocal.forEach((p: any, i: number) =>
        console.log(`  ${i + 1}: (${p.x.toFixed(4)}, ${p.y.toFixed(4)}, ${p.z.toFixed(4)})`)
      );

      // Step 1: Compute centroids
      const realCentroid = new THREE.Vector3();
      const modelLocalCentroid = new THREE.Vector3();

      for (let i = 0; i < n; i++) {
        realCentroid.add(real[i]);
        modelLocalCentroid.add(modelLocal[i]);
      }
      realCentroid.divideScalar(n);
      modelLocalCentroid.divideScalar(n);

      console.log('[triangle-align] Centroids:');
      console.log('  Real:', realCentroid.x.toFixed(4), realCentroid.y.toFixed(4), realCentroid.z.toFixed(4));
      console.log('  Model local:', modelLocalCentroid.x.toFixed(4), modelLocalCentroid.y.toFixed(4), modelLocalCentroid.z.toFixed(4));

      // Step 2: Center the point sets (subtract centroids)
      const realCentered: any[] = [];
      const modelLocalCentered: any[] = [];

      for (let i = 0; i < n; i++) {
        realCentered.push(real[i].clone().sub(realCentroid));
        modelLocalCentered.push(modelLocal[i].clone().sub(modelLocalCentroid));
      }

      // Step 3: Compute scale from distance between points 1 and 2
      const realDist12 = real[0].distanceTo(real[1]);
      const modelLocalDist12 = modelLocal[0].distanceTo(modelLocal[1]);

      if (modelLocalDist12 < 0.0001) {
        console.error('[triangle-align] Model markers 1 and 2 are too close together');
        return null;
      }

      const scaleFactor = realDist12 / modelLocalDist12;
      console.log('[triangle-align] Scale factor:', scaleFactor.toFixed(6));

      // Apply scale to model centered points
      const modelLocalScaled: any[] = [];
      for (let i = 0; i < n; i++) {
        modelLocalScaled.push(modelLocalCentered[i].clone().multiplyScalar(scaleFactor));
      }

      // Step 4: Compute rotation using orthonormal frame alignment on CENTERED points
      const realFrame = this.buildOrthonormalFrame(realCentered[0], realCentered[1], realCentered[2]);
      const modelLocalFrame = this.buildOrthonormalFrame(modelLocalScaled[0], modelLocalScaled[1], modelLocalScaled[2]);

      const modelLocalMatrix = new THREE.Matrix4().makeBasis(
        modelLocalFrame.x,
        modelLocalFrame.y,
        modelLocalFrame.z
      );
      const realMatrix = new THREE.Matrix4().makeBasis(realFrame.x, realFrame.y, realFrame.z);

      const modelLocalMatrixInv = modelLocalMatrix.clone().invert();
      const rotationMatrix = new THREE.Matrix4().multiplyMatrices(realMatrix, modelLocalMatrixInv);

      const newQuat = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
      const newScale = new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor);

      // Step 5: Compute position using CENTROID alignment
      // We want: realCentroid = newPos + newQuat * (newScale * modelLocalCentroid)
      // So: newPos = realCentroid - newQuat * (newScale * modelLocalCentroid)
      const scaledLocalCentroid = modelLocalCentroid.clone().multiply(newScale);
      const rotatedScaledCentroid = scaledLocalCentroid.clone().applyQuaternion(newQuat);
      const newPos = realCentroid.clone().sub(rotatedScaledCentroid);

      console.log('[triangle-align] New transform:');
      console.log('  Position:', newPos.x.toFixed(6), newPos.y.toFixed(6), newPos.z.toFixed(6));
      console.log('  Quaternion:', newQuat.x.toFixed(6), newQuat.y.toFixed(6), newQuat.z.toFixed(6), newQuat.w.toFixed(6));
      console.log('  Scale:', newScale.x.toFixed(6));

      // Verify alignment quality
      console.log('[triangle-align] Verification (predicted distances):');
      let totalError = 0;
      for (let i = 0; i < n; i++) {
        const predicted = newPos.clone().add(modelLocal[i].clone().multiply(newScale).applyQuaternion(newQuat));
        const dist = predicted.distanceTo(real[i]);
        totalError += dist;
        console.log(`  Point ${i + 1}: ${dist.toFixed(6)}m`);
      }
      console.log(`  TOTAL: ${totalError.toFixed(6)}m, AVG: ${(totalError / n).toFixed(6)}m`);

      return {
        position: newPos,
        quaternion: newQuat,
        scale: newScale,
      };
    },

    /**
     * Animate the container to the target transform
     */
    animateToTransform: function (targetPos: any, targetQuat: any, targetScale: any) {
      const container = this.el.object3D;
      const startPos = container.position.clone();
      const startQuat = container.quaternion.clone();
      const startScale = container.scale.clone();

      const duration = this.data.animationDuration;
      const startTime = performance.now();
      const self = this;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);

        // Ease in-out
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        // Interpolate
        container.position.lerpVectors(startPos, targetPos, eased);
        container.quaternion.slerpQuaternions(startQuat, targetQuat, eased);
        container.scale.lerpVectors(startScale, targetScale, eased);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure final values are exact
          container.position.copy(targetPos);
          container.quaternion.copy(targetQuat);
          container.scale.copy(targetScale);

          console.log('[triangle-align] Animation complete');
          self.el.emit('alignment-complete', {
            position: targetPos,
            quaternion: targetQuat,
            scale: targetScale,
          });
        }
      };

      requestAnimationFrame(animate);
    },

    remove: function () {
      console.log('[triangle-align] Removed');
    },
  });
}

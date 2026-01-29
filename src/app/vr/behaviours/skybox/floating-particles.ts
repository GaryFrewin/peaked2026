/**
 * Floating Particles Atmosphere Effect
 * 
 * Creates atmospheric dust-mote particles that drift gently upward.
 * Uses THREE.js Points for performance (hundreds of particles with minimal overhead).
 * 
 * Usage:
 *   <a-entity floating-particles="count: 200; size: 0.02"></a-entity>
 */

declare const AFRAME: any;
const THREE = AFRAME.THREE;

AFRAME.registerComponent('floating-particles', {
  schema: {
    count: { type: 'int', default: 200 },
    size: { type: 'number', default: 0.015 },
    spread: { type: 'vec3', default: { x: 12, y: 8, z: 12 } },
    speed: { type: 'number', default: 0.15 },
    color: { type: 'color', default: '#ffffee' },
    opacity: { type: 'number', default: 0.6 },
  },

  init: function () {
    this.particles = null;
    this.velocities = [];
    this.matrices = [];
    this.createParticles();
    console.log('[floating-particles] Initialized');
  },

  createParticles: function () {
    const { count, size, spread, color, opacity } = this.data;

    // Use InstancedMesh for efficient rendering of many cubes
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,  // Render on top of everything, ignore depth buffer
    });

    this.particles = new THREE.InstancedMesh(geometry, material, count);
    this.particles.renderOrder = 999;  // Render after skybox/occlusion

    // Initialize positions and velocities
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
      // Position
      dummy.position.set(
        (Math.random() - 0.5) * spread.x,
        Math.random() * spread.y - 1,
        (Math.random() - 0.5) * spread.z
      );
      
      // Random rotation for variety
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      dummy.updateMatrix();
      this.particles.setMatrixAt(i, dummy.matrix);
      this.matrices.push(dummy.matrix.clone());

      // Velocity for gentle floating
      this.velocities.push({
        x: (Math.random() - 0.5) * 0.01,
        y: 0.002 + Math.random() * 0.005, // Gentle upward drift
        z: (Math.random() - 0.5) * 0.01,
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
        rotZ: (Math.random() - 0.5) * 0.02,
      });
    }

    this.particles.instanceMatrix.needsUpdate = true;
    this.el.object3D.add(this.particles);

    console.log(`[floating-particles] Created ${count} cube particles`);
  },

  tick: function (_time: number, delta: number) {
    if (!this.particles || !delta) return;

    const { spread, speed } = this.data;
    const dt = Math.min(delta / 1000, 0.1) * speed;

    // Get camera position to keep particles around the user
    const camera = this.el.sceneEl?.camera;
    const camPos = camera ? camera.position : { x: 0, y: 0, z: 0 };

    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.velocities.length; i++) {
      const vel = this.velocities[i];
      const matrix = this.matrices[i];

      // Extract current position from matrix
      const position = new THREE.Vector3();
      const rotation = new THREE.Euler();
      const scale = new THREE.Vector3();
      matrix.decompose(position, new THREE.Quaternion(), scale);
      rotation.setFromQuaternion(new THREE.Quaternion().setFromRotationMatrix(matrix));

      // Update position
      position.x += vel.x * dt * 60;
      position.y += vel.y * dt * 60;
      position.z += vel.z * dt * 60;

      // Update rotation
      rotation.x += vel.rotX * dt * 60;
      rotation.y += vel.rotY * dt * 60;
      rotation.z += vel.rotZ * dt * 60;

      // Wrap particles to stay around camera
      const halfX = spread.x / 2;
      const halfZ = spread.z / 2;

      if (position.x > camPos.x + halfX) position.x = camPos.x - halfX;
      if (position.x < camPos.x - halfX) position.x = camPos.x + halfX;
      if (position.y > spread.y) position.y = -1;
      if (position.y < -1) position.y = spread.y;
      if (position.z > camPos.z + halfZ) position.z = camPos.z - halfZ;
      if (position.z < camPos.z - halfZ) position.z = camPos.z + halfZ;

      // Update matrix
      dummy.position.copy(position);
      dummy.rotation.copy(rotation);
      dummy.updateMatrix();
      this.particles.setMatrixAt(i, dummy.matrix);
      this.matrices[i].copy(dummy.matrix);
    }

    this.particles.instanceMatrix.needsUpdate = true;
  },

  remove: function () {
    if (this.particles) {
      this.el.object3D.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
      this.velocities = [];
      this.matrices = [];
      console.log('[floating-particles] Removed');
    }
  },
});

export {};

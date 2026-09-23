import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const OceanEnvironment: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 1. Undulating Bathymetric Floor Mesh (Wireframe Depth Grid)
    const planeSize = 160;
    const planeSegments = 28;
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize, planeSegments, planeSegments);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x064e6b,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const bathymetricFloor = new THREE.Mesh(planeGeo, planeMat);
    bathymetricFloor.rotation.x = -Math.PI / 2;
    bathymetricFloor.position.y = -16;
    scene.add(bathymetricFloor);

    // Initial position copy for wave oscillation
    const initialPositions = planeGeo.attributes.position.clone();

    // 2. Subtle Oceanic Particles (Marine Snow / Current Drift)
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 130;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 110;

      velocities[i * 3] = (Math.random() - 0.5) * 0.015;
      velocities[i * 3 + 1] = -Math.random() * 0.012 - 0.004; // slow sinking
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x22d3ee, // cyan-400
      size: 1.1,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 3. Faint Bathymetric / Nautical Ring Grid
    const ringGeo = new THREE.RingGeometry(24, 24.35, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -6;
    scene.add(ring);

    const outerRingGeo = new THREE.RingGeometry(46, 46.3, 64);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = -6;
    scene.add(outerRing);

    // Mouse Parallax
    let targetCameraX = 0;
    let targetCameraY = 30;
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      targetCameraX = normX * 6;
      targetCameraY = 30 - normY * 4;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Animation Loop with Visibility Check
    let animationFrameId: number;
    let isTabVisible = !document.hidden;
    let clock = new THREE.Clock();

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const elapsedTime = clock.getElapsedTime();

      // Camera gentle parallax interpolation
      camera.position.x += (targetCameraX - camera.position.x) * 0.03;
      camera.position.y += (targetCameraY - camera.position.y) * 0.03;
      camera.lookAt(0, -5, 0);

      // 1. Bathymetric Current Undulation
      const posAttr = planeGeo.attributes.position as THREE.BufferAttribute;
      const initArr = initialPositions.array as Float32Array;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < posAttr.count; i++) {
        const u = initArr[i * 3];
        const v = initArr[i * 3 + 1];
        // Harmonic ocean swell equation
        posArr[i * 3 + 2] =
          Math.sin(u * 0.06 + elapsedTime * 0.45) * 1.6 +
          Math.cos(v * 0.06 + elapsedTime * 0.35) * 1.4;
      }
      posAttr.needsUpdate = true;

      // 2. Marine Particle Drift
      const partPosAttr = geometry.attributes.position as THREE.BufferAttribute;
      const partPosArray = partPosAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        partPosArray[i * 3] += velocities[i * 3];
        partPosArray[i * 3 + 1] += velocities[i * 3 + 1];
        partPosArray[i * 3 + 2] += velocities[i * 3 + 2];

        // Wrap around bounds
        if (partPosArray[i * 3 + 1] < -20) {
          partPosArray[i * 3 + 1] = 18;
        }
      }
      partPosAttr.needsUpdate = true;

      // 3. Slow ring rotation
      ring.rotation.z += 0.0006;
      outerRing.rotation.z -= 0.0003;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      planeGeo.dispose();
      planeMat.dispose();
      initialPositions.dispose();
      geometry.dispose();
      material.dispose();
      ringGeo.dispose();
      outerRingGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60"
      aria-hidden="true"
    />
  );
};

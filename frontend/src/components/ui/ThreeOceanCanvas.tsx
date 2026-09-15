import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeOceanCanvasProps {
  className?: string;
  opacity?: number;
}

export const ThreeOceanCanvas: React.FC<ThreeOceanCanvasProps> = ({
  className = '',
  opacity = 0.45,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020611, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. Create 3D Ocean Wave Geometry & Particle Grid
    const width = 120;
    const depth = 120;
    const segments = 90;

    const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const count = geometry.attributes.position.count;
    const initialY = new Float32Array(count);
    const positionAttribute = geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      initialY[i] = positionAttribute.getY(i);
    }

    // Material with ocean blue points
    const material = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const oceanPoints = new THREE.Points(geometry, material);
    scene.add(oceanPoints);

    // 3. Create Ambient Floating 3D Particles
    const particleCount = 400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 100;
      particlePos[i + 1] = Math.random() * 30 - 5;
      particlePos[i + 2] = (Math.random() - 0.5) * 100;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.45,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const floatingParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(floatingParticles);

    // 4. Mouse Tracking for Subtle Camera Tilt
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 4;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 5. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Wave math for ocean points
      const positions = geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Sinusoidal wave equations
        const y =
          Math.sin(x * 0.2 + elapsedTime * 1.5) * 1.2 +
          Math.cos(z * 0.2 + elapsedTime * 1.2) * 1.0 +
          Math.sin((x + z) * 0.1 + elapsedTime * 0.8) * 0.8;

        positions.setY(i, y);
      }
      positions.needsUpdate = true;

      // Rotate floating particles slightly
      floatingParticles.rotation.y = elapsedTime * 0.03;

      // Smooth camera interpolation
      camera.position.x += (mouseX - camera.position.x) * 0.03;
      camera.position.y += (15 - mouseY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 6. Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      style={{ opacity }}
    />
  );
};

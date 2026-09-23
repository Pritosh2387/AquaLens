import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../utils/cn';

interface TacticalGlobe3DProps {
  targetLat?: number;
  targetLon?: number;
  targetName?: string;
  className?: string;
  size?: number;
}

export const TacticalGlobe3D: React.FC<TacticalGlobe3DProps> = ({
  targetLat = 18.97,
  targetLon = 72.82,
  targetName = 'SCENE_001 [ARABIAN SEA]',
  className,
  size = 280,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 1. Dark Oceanic Core Sphere
    const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x041122,
      transparent: true,
      opacity: 0.85,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // 2. Graticule / Wireframe Latitude-Longitude Grid
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x0e3a5f,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const graticule = new THREE.Mesh(new THREE.SphereGeometry(1.002, 24, 24), wireframeMat);
    scene.add(graticule);

    // 3. Equator & Prime Meridian Highlight Rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
    });
    const equatorGeo = new THREE.RingGeometry(1.008, 1.015, 64);
    const equator = new THREE.Mesh(equatorGeo, ringMat);
    equator.rotation.x = Math.PI / 2;
    scene.add(equator);

    // 4. Satellite Orbit Path (inclined ellipse)
    const orbitRadius = 1.35;
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, Math.sin(theta) * 0.3, Math.sin(theta) * orbitRadius));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.rotation.z = Math.PI / 6;
    scene.add(orbitLine);

    // 5. Target Coordinate Marker on Surface (Lat/Lon to 3D Cartesian)
    const phi = (90 - targetLat) * (Math.PI / 180);
    const theta = (targetLon + 180) * (Math.PI / 180);
    const markerRadius = 1.02;
    const x = -(markerRadius * Math.sin(phi) * Math.cos(theta));
    const z = markerRadius * Math.sin(phi) * Math.sin(theta);
    const y = markerRadius * Math.cos(phi);

    const markerGroup = new THREE.Group();
    const pinGeo = new THREE.SphereGeometry(0.035, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(x, y, z);
    markerGroup.add(pin);

    // Pulse Ring around target
    const pulseRingGeo = new THREE.RingGeometry(0.04, 0.055, 32);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    pulseRing.position.set(x, y, z);
    pulseRing.lookAt(x * 2, y * 2, z * 2);
    markerGroup.add(pulseRing);
    scene.add(markerGroup);

    // User Interactive Drag
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      sphere.rotation.y += deltaX * 0.005;
      graticule.rotation.y += deltaX * 0.005;
      markerGroup.rotation.y += deltaX * 0.005;

      sphere.rotation.x += deltaY * 0.005;
      graticule.rotation.x += deltaY * 0.005;
      markerGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animationFrameId: number;
    let pulseScale = 1;
    let pulseGrowing = true;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging && !reducedMotion) {
        // Slow axial rotation
        sphere.rotation.y += 0.002;
        graticule.rotation.y += 0.002;
        markerGroup.rotation.y += 0.002;
        orbitLine.rotation.y += 0.003;
      }

      // Beacon Pulse Animation
      if (pulseGrowing) {
        pulseScale += 0.015;
        if (pulseScale >= 1.6) pulseGrowing = false;
      } else {
        pulseScale -= 0.015;
        if (pulseScale <= 0.8) pulseGrowing = true;
      }
      pulseRing.scale.set(pulseScale, pulseScale, pulseScale);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      sphereGeo.dispose();
      sphereMat.dispose();
      wireframeMat.dispose();
      ringMat.dispose();
      equatorGeo.dispose();
      orbitGeo.dispose();
      orbitMat.dispose();
      pinGeo.dispose();
      pinMat.dispose();
      pulseRingGeo.dispose();
      pulseRingMat.dispose();
      renderer.dispose();
    };
  }, [targetLat, targetLon, size, reducedMotion]);

  return (
    <div className={cn('relative flex flex-col items-center justify-center font-mono', className)}>
      <div
        ref={mountRef}
        className="cursor-grab active:cursor-grabbing rounded-full overflow-hidden border border-[rgba(56,189,248,0.2)] bg-[#020713]/80 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
        style={{ width: size, height: size }}
        title="Interactive 3D Maritime Globe — Click & Drag to Rotate"
      />
      <div className="mt-2 text-center">
        <span className="text-[10px] text-cyan-400 font-bold tracking-wider block">
          TACTICAL SURVEILLANCE SPHERE
        </span>
        <span className="text-[11px] text-slate-300">
          {targetName} ({targetLat.toFixed(2)}°N, {targetLon.toFixed(2)}°E)
        </span>
      </div>
    </div>
  );
};

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ScrollCogProps {
  /** Number of fins/teeth around the wheel */
  toothCount?: number;
  /** Pixels of scroll per 1-fin rotation step */
  pixelsPerTooth?: number;
}

export default function ScrollCog({
  toothCount = 28,
  pixelsPerTooth = 140,
}: ScrollCogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 120;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3-point workshop lighting for crisp wood & brass shading
    const hemiLight = new THREE.HemisphereLight(0xfff1d6, 0x1a1612, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe0b2, 1.85);
    keyLight.position.set(2.5, 4, 3.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfbbf24, 0.85);
    rimLight.position.set(-3, -2.5, 2.2);
    scene.add(rimLight);

    const wheelGroup = new THREE.Group();
    const wheelRadius = 2.35;
    wheelGroup.position.set(0, 0, -2.15);
    scene.add(wheelGroup);

    // Dark iron/andesite inner rim
    const rimGeo = new THREE.CylinderGeometry(
      wheelRadius - 0.16,
      wheelRadius - 0.16,
      0.44,
      toothCount * 2
    );
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x3b3d42,
      roughness: 0.45,
      metalness: 0.6,
    });
    wheelGroup.add(new THREE.Mesh(rimGeo, rimMat));

    // Subtle brass trim ring along the rim
    const brassGeo = new THREE.CylinderGeometry(
      wheelRadius - 0.14,
      wheelRadius - 0.14,
      0.12,
      toothCount * 2
    );
    brassGeo.rotateZ(Math.PI / 2);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc8963e,
      roughness: 0.32,
      metalness: 0.78,
    });
    wheelGroup.add(new THREE.Mesh(brassGeo, brassMat));

    // Thinner, wider spruce-wood fins
    const finWidth = 0.62;
    const finThickness = 0.052;
    const finDepth = 0.25;

    const finGeo = new THREE.BoxGeometry(finWidth, finThickness, finDepth);
    const finBodyMat = new THREE.MeshStandardMaterial({
      color: 0x8a5630,
      roughness: 0.72,
      metalness: 0.08,
    });

    // 2-layer clean white glow line on the front edge of each fin
    const coreGeo = new THREE.BoxGeometry(finWidth + 0.01, 0.011, 0.018);
    const haloGeo = new THREE.BoxGeometry(finWidth + 0.03, 0.032, 0.014);

    interface FinEntry {
      coreMat: THREE.MeshBasicMaterial;
      haloMat: THREE.MeshBasicMaterial;
      angle: number;
    }

    const fins: FinEntry[] = [];

    for (let i = 0; i < toothCount; i++) {
      const angle = (i / toothCount) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.rotation.x = angle;

      const finMesh = new THREE.Mesh(finGeo, finBodyMat);
      finMesh.position.set(0, 0, wheelRadius - 0.04);
      pivot.add(finMesh);

      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
      });
      const coreLine = new THREE.Mesh(coreGeo, coreMat);
      coreLine.position.set(0, 0, wheelRadius + finDepth / 2 - 0.032);
      pivot.add(coreLine);

      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const haloLine = new THREE.Mesh(haloGeo, haloMat);
      haloLine.position.set(0, 0, wheelRadius + finDepth / 2 - 0.034);
      pivot.add(haloLine);

      wheelGroup.add(pivot);
      fins.push({ coreMat, haloMat, angle });
    }

    // Scroll -> rotation mapping
    const anglePerTooth = (Math.PI * 2) / toothCount;
    let targetRotation = (window.scrollY / pixelsPerTooth) * anglePerTooth;
    let currentRotation = targetRotation;

    const onScroll = () => {
      targetRotation = (window.scrollY / pixelsPerTooth) * anglePerTooth;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      currentRotation += (targetRotation - currentRotation) * 0.14;
      wheelGroup.rotation.x = currentRotation;

      for (const fin of fins) {
        const totalAngle = fin.angle + currentRotation;
        const y = -Math.sin(totalAngle) * wheelRadius;
        const z = Math.cos(totalAngle) * wheelRadius;

        if (z < 0) {
          fin.coreMat.opacity = 0;
          fin.haloMat.opacity = 0;
          continue;
        }

        const distFromCenter = Math.abs(y);
        const intensity = Math.max(
          0.14,
          Math.exp(-(distFromCenter * distFromCenter) * 2.4)
        );
        fin.coreMat.opacity = intensity;
        fin.haloMat.opacity = intensity * 0.45;
      }

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      rimGeo.dispose();
      rimMat.dispose();
      brassGeo.dispose();
      brassMat.dispose();
      finGeo.dispose();
      finBodyMat.dispose();
      coreGeo.dispose();
      haloGeo.dispose();
      for (const fin of fins) {
        fin.coreMat.dispose();
        fin.haloMat.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [toothCount, pixelsPerTooth]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed right-2 top-0 h-screen w-28 pointer-events-none z-40"
    />
  );
}

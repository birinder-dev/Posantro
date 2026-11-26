"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadMcModel } from "@/lib/three/mcModelLoader";

export default function CogViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.4, 2.0, 2.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Warm workshop lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffe6c2, 1.6);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9ec5ff, 0.5);
    fillLight.position.set(-4, -2, -3);
    scene.add(fillLight);

    let smallCog: THREE.Group | null = null;
    let largeCog: THREE.Group | null = null;
    let disposed = false;

    Promise.all([
      loadMcModel("/models/create/cogwheel.json"),
      loadMcModel("/models/create/large_cogwheel.json"),
    ])
      .then(([small, large]) => {
        if (disposed) return;
        small.position.set(-0.95, 0, 0);
        large.position.set(0.65, 0, 0);
        scene.add(small);
        scene.add(large);
        smallCog = small;
        largeCog = large;
      })
      .catch((err) => {
        console.error("Failed to load cogwheel models:", err);
      });

    let frameId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (smallCog) {
        smallCog.rotation.y += dt * 1.2;
      }
      if (largeCog) {
        // Large cog has 2x teeth, so it spins at half speed in the opposite direction
        largeCog.rotation.y -= dt * 0.6;
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
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[420px] rounded-xl border border-zinc-800 bg-zinc-900/60"
    />
  );
}

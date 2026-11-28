"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { loadMcModel } from "@/lib/three/mcModelLoader";

interface ScrollCogProps {
  /** Pixels of scroll per 1-tooth rotation step (Create large_cogwheel has 16 teeth) */
  pixelsPerTooth?: number;
}

export default function ScrollCog({ pixelsPerTooth = 140 }: ScrollCogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 64;
    const height = container.clientHeight || window.innerHeight - 48;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Neutral white lighting so Create's vanilla textures keep their true colors
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x777777, 1.3);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(-1.6, 4.5, 4.2);
    scene.add(keyLight);

    // 3-step toon gradient map for crisp cartoony cel-shading bands
    const gradientData = new Uint8Array([95, 175, 255]);
    const gradientMap = new THREE.DataTexture(
      gradientData,
      3,
      1,
      THREE.RedFormat
    );
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.needsUpdate = true;

    const outlineMat = new THREE.LineBasicMaterial({
      color: 0x161210,
      transparent: true,
      opacity: 0.72,
    });
    const edgeGeometries: THREE.EdgesGeometry[] = [];
    const toonMaterials: THREE.MeshToonMaterial[] = [];

    // Holder tilts the Minecraft Y-axis cogwheel sideways (axle along X) for side-view
    const holder = new THREE.Group();
    holder.rotation.z = Math.PI / 2;
    holder.position.set(0.07, 0, -1.2);
    scene.add(holder);

    let cogModel: THREE.Group | null = null;
    let disposed = false;

    loadMcModel("/models/create/large_cogwheel.json")
      .then((model) => {
        if (disposed) return;

        model.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            // Convert each face's standard material to cel-shaded MeshToonMaterial
            const convertMat = (m: THREE.Material): THREE.Material => {
              if (m instanceof THREE.MeshStandardMaterial) {
                const toon = new THREE.MeshToonMaterial({
                  map: m.map,
                  gradientMap,
                  alphaTest: m.alphaTest,
                });
                toonMaterials.push(toon);
                return toon;
              }
              return m;
            };

            if (Array.isArray(obj.material)) {
              obj.material = obj.material.map(convertMat);
            } else {
              obj.material = convertMat(obj.material);
            }

            // Crisp dark cartoon ink outlines on cuboid corners
            const edges = new THREE.EdgesGeometry(obj.geometry, 25);
            edgeGeometries.push(edges);
            obj.add(new THREE.LineSegments(edges, outlineMat));
          }
        });

        model.scale.set(1.55, 0.55, 1.55);
        holder.add(model);
        cogModel = model;
      })
      .catch((err) => {
        console.error("Failed to load Create large_cogwheel:", err);
      });

    // Create large_cogwheel has 16 teeth around the rim
    const toothCount = 16;
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

      if (cogModel) {
        cogModel.rotation.y = currentRotation;
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
      window.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      gradientMap.dispose();
      outlineMat.dispose();
      for (const g of edgeGeometries) g.dispose();
      for (const m of toonMaterials) m.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [pixelsPerTooth]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed right-0 top-0 h-screen w-20 overflow-hidden pointer-events-none z-40"
    />
  );
}

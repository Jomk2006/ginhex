"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import * as THREE from "three";

type DeviceTier = "static" | "low" | "medium" | "high";

function getDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "medium";
  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isReducedMotion) return "static";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  if (isMobile && (cores <= 4 || memory <= 4)) return "low";
  if (isMobile) return "medium";
  return "high";
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

const NODE_COUNTS: Record<DeviceTier, number> = { static: 0, low: 60, medium: 140, high: 260 };

const CYAN = 0x00bcc8;
const LIME = 0xd0ff00;

/** Builds the GENHEX Core: nested hex-prism wireframe rings + a scattered
 *  node/connection field, echoing the brand board's own "hex grid /
 *  connected nodes / workflow paths" graphic language — not a generic shape. */
function buildCore(nodeCount: number): THREE.Group {
  const group = new THREE.Group();

  // Three interlocking hexagonal rings at different depths/rotations —
  // reads as the logo's interlocking hexagon motif, extruded into 3D.
  const ringMaterial = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.85 });
  const ringConfigs = [
    { radius: 1.6, z: 0, rotX: 0 },
    { radius: 1.6, z: 0, rotX: Math.PI / 3 },
    { radius: 1.6, z: 0, rotX: (Math.PI / 3) * 2 },
  ];
  for (const cfg of ringConfigs) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * cfg.radius, Math.sin(angle) * cfg.radius, cfg.z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const ring = new THREE.Line(geometry, ringMaterial);
    ring.rotation.x = cfg.rotX;
    ring.rotation.y = Math.PI / 5;
    group.add(ring);
  }

  // Inner solid hex-prism core (subtle emissive fill, low opacity).
  const coreGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 6);
  const coreMaterial = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.12, wireframe: false });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.rotation.x = Math.PI / 2;
  group.add(core);

  // Ambient node/connection field — small lime + cyan points with faint
  // connecting lines to nearby nodes, echoing "connected nodes / workflow
  // paths" from the brand board. Kept sparse and slow (atmosphere, not focus).
  if (nodeCount > 0) {
    const nodePositions: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const radius = 2.4 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      nodePositions.push(
        new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi) * 0.5
        )
      );
    }

    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(nodePositions);
    const pointsMaterial = new THREE.PointsMaterial({ color: LIME, size: 0.045, transparent: true, opacity: 0.8 });
    group.add(new THREE.Points(pointsGeometry, pointsMaterial));

    // Sparse connecting lines between near-neighbor nodes only.
    const linePositions: number[] = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 1.1 && Math.random() < 0.15) {
          linePositions.push(
            nodePositions[i].x,
            nodePositions[i].y,
            nodePositions[i].z,
            nodePositions[j].x,
            nodePositions[j].y,
            nodePositions[j].z
          );
        }
      }
    }
    if (linePositions.length > 0) {
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.15 });
      group.add(new THREE.LineSegments(lineGeometry, lineMaterial));
    }
  }

  return group;
}

export function GenhexCoreScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const [webglOk, setWebglOk] = useState(true);
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    // Client-only capability detection (window/navigator), deliberately
    // deferred to an effect so the initial SSR/hydration render is
    // consistent (tier stays null) and only updates after mount — the
    // correct pattern here despite the lint rule's general guidance.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTier(getDeviceTier());
    setWebglOk(hasWebGL());
  }, []);

  useEffect(() => {
    if (!tier || tier === "static" || !webglOk) return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    // "pan-y" (not "none"): lets a vertical touch-drag over the canvas fall
    // through to the browser as a normal page scroll, while horizontal
    // drag is still captured below for the rotate gesture. "none" was
    // eating every touch that started on the hero -- which is the full
    // width/height of the screen on mobile -- so swiping down to scroll
    // past the hero instead rotated the 3D scene and never scrolled.
    renderer.domElement.style.touchAction = "pan-y";
    container.appendChild(renderer.domElement);

    const core = buildCore(NODE_COUNTS[tier]);
    // Shifted toward the side opposite the text (which anchors bottom-end:
    // bottom-left in LTR, bottom-right in RTL), so the composition mirrors
    // correctly instead of the shape colliding with the heading in RTL.
    // since the canvas is now a full-bleed background, not its own column.
    core.position.x = isRTL ? -1.4 : 1.4;
    scene.add(core);

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let autoSpin = true;
    let animId: number;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      autoSpin = false;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      core.rotation.y += (e.clientX - prevX) * 0.008;
      core.rotation.x += (e.clientY - prevY) * 0.008;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);

    function animate() {
      if (autoSpin) {
        core.rotation.y += 0.0022;
        core.rotation.x += 0.0006;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
          obj.geometry?.dispose();
          const material = obj.material;
          (Array.isArray(material) ? material : [material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [tier, webglOk, isRTL]);

  // Static/reduced-motion/no-WebGL fallback — same brand mood, no JS.
  if (tier === "static" || !webglOk) {
    return (
      <div className="absolute inset-0 flex items-center justify-end pe-[8%]">
        <div className="relative aspect-square w-[60%] max-w-lg">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(0,188,200,0.35),_transparent_70%)] blur-2xl" />
          <svg viewBox="0 0 200 200" className="relative h-full w-full" aria-hidden="true">
            <polygon
              points="100,10 173,55 173,145 100,190 27,145 27,55"
              fill="none"
              stroke="#00BCC8"
              strokeWidth="1.5"
              opacity="0.9"
            />
            <polygon
              points="100,40 148,68 148,132 100,160 52,132 52,68"
              fill="none"
              stroke="#D0FF00"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}

"use client";

// Máy quay: xoay/zoom tự do (OrbitControls) + bay mượt tới khung ảnh được chọn,
// nhấp đúp lên sàn để "đi bộ" tới điểm đó, và luôn giữ máy quay bên trong sảnh.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { easing } from "maath";
import type { Vec3 } from "./hallLayout";

export interface CameraGoal {
  position: Vec3;
  target: Vec3;
  key: number; // đổi key để kích hoạt lại cùng 1 đích
}

export interface WalkGoal {
  point: Vec3;
  key: number;
}

interface Props {
  goal: CameraGoal | null;
  walk: WalkGoal | null;
  hallRadius: number;
  ceiling: number;
  autoRotate: boolean;
}

export default function CameraRig({ goal, walk, hallRadius, ceiling, autoRotate }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null);
  const { camera } = useThree();
  const active = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);

  useEffect(() => {
    if (!goal) return;
    active.current = { pos: new THREE.Vector3(...goal.position), look: new THREE.Vector3(...goal.target) };
  }, [goal]);

  // Nhấp đúp lên sàn: đứng tại điểm đó, nhìn tiếp theo hướng đang đi
  useEffect(() => {
    if (!walk) return;
    const point = new THREE.Vector3(walk.point[0], 1.75, walk.point[2]);
    const dir = point.clone().sub(camera.position).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1);
    dir.normalize();
    active.current = { pos: point, look: point.clone().add(dir.multiplyScalar(2.2)).setY(1.7) };
  }, [walk, camera]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const dt = Math.min(delta, 0.1);

    if (active.current) {
      easing.damp3(camera.position, active.current.pos, 0.55, dt);
      easing.damp3(c.target, active.current.look, 0.55, dt);
      if (camera.position.distanceTo(active.current.pos) < 0.02 && c.target.distanceTo(active.current.look) < 0.02) {
        active.current = null;
      }
    }

    // Giữ máy quay trong sảnh (không xuyên tường / sàn / mái)
    const maxR = hallRadius - 0.7;
    const horiz = Math.hypot(camera.position.x, camera.position.z);
    if (horiz > maxR) {
      camera.position.x *= maxR / horiz;
      camera.position.z *= maxR / horiz;
    }
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.5, ceiling);
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      minDistance={1.2}
      maxDistance={hallRadius * 1.6}
      maxPolarAngle={Math.PI * 0.62}   // cho phép ngước nhìn mái vòm, không chui xuống sàn
      minPolarAngle={Math.PI * 0.12}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      autoRotate={autoRotate}
      autoRotateSpeed={0.35}
      onStart={() => { active.current = null; }} // người dùng tự kéo thì dừng bay tự động
    />
  );
}

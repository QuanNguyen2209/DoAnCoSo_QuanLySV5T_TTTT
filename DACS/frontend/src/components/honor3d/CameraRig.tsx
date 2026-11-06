"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface CameraRigProps {
  targetPosition: [number, number, number] | null;
  targetLookAt: [number, number, number] | null;
}

export default function CameraRig({
  targetPosition,
  targetLookAt,
}: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Mặc định góc nhìn tổng quan
  const defaultPos = new THREE.Vector3(0, 2.5, 9);
  const defaultLookAt = new THREE.Vector3(0, 0.5, 0);

  useEffect(() => {
    if (!targetPosition && controlsRef.current) {
      controlsRef.current.target.copy(defaultLookAt);
    }
  }, [targetPosition]);

  useFrame((_, delta) => {
    if (targetPosition && targetLookAt) {
      // Khi chọn một sinh viên: Di chuyển camera mượt mà đến trước mặt sinh viên đó
      const desiredPos = new THREE.Vector3(...targetPosition);
      const desiredLook = new THREE.Vector3(...targetLookAt);

      camera.position.lerp(desiredPos, delta * 3.5);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(desiredLook, delta * 3.5);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={16}
      maxPolarAngle={Math.PI / 2 - 0.05} // Không chui xuống dưới sàn
      minPolarAngle={Math.PI / 6} // Không nhìn thẳng từ đỉnh đầu
      autoRotate={!targetPosition} // Tự động xoay nhẹ khi chưa chọn sinh viên
      autoRotateSpeed={0.5}
    />
  );
}

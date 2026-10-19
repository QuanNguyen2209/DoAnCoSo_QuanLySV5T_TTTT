"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

export default function TrophyCenter3D() {
  const trophyGroup = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (trophyGroup.current) {
      trophyGroup.current.rotation.y += delta * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Bục đế hình trụ */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 2, 0.4, 32]} />
        <meshStandardMaterial
          color="#1e1b4b"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Vòng sáng quanh bục */}
      <mesh ref={ringRef} position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.65, 1.75, 64]} />
        <meshBasicMaterial color="#6366f1" side={THREE.DoubleSide} />
      </mesh>

      {/* Cúp Vàng xoay bồng bềnh */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={trophyGroup} position={[0, 0.8, 0]}>
          {/* Đáy cúp */}
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.15, 24]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.9}
              roughness={0.15}
            />
          </mesh>

          {/* Thân cúp */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.12, 0.2, 0.4, 24]} />
            <meshStandardMaterial
              color="#f59e0b"
              metalness={0.95}
              roughness={0.1}
            />
          </mesh>

          {/* Chén cúp */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.55, 0.2, 0.6, 24, 1, true]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.9}
              roughness={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Quả cầu vinh danh ở giữa chén */}
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#818cf8"
              emissiveIntensity={0.8}
              roughness={0.1}
            />
          </mesh>

          {/* Ngôi sao 5 cánh SV5T tượng trưng trên đỉnh */}
          <mesh position={[0, 0.75, 0]}>
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#f59e0b"
              emissiveIntensity={0.6}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Hạt lấp lánh xung quanh cúp */}
          <Sparkles
            count={40}
            scale={2.2}
            size={3}
            speed={0.6}
            color="#fbbf24"
          />
        </group>
      </Float>
    </group>
  );
}

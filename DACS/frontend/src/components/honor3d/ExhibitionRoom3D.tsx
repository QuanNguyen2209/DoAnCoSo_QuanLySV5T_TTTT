"use client";

import { MeshReflectorMaterial, Sparkles } from "@react-three/drei";

export default function ExhibitionRoom3D() {
  return (
    <group>
      {/* Sàn đá cẩm thạch đen phản chiếu gương siêu đẹp */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.8, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mirror={0.6}
          mixBlur={1}
          mixStrength={40}
          roughness={0.2}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0b0f19"
          metalness={0.7}
        />
      </mesh>

      {/* Ánh sáng sảnh triển lãm */}
      <ambientLight intensity={0.7} color="#c7d2fe" />

      {/* Spotlight chiếu từ trên xuống bục cúp trung tâm */}
      <spotLight
        position={[0, 10, 0]}
        angle={0.5}
        penumbra={0.8}
        intensity={3.5}
        color="#fbbf24"
        castShadow
      />

      {/* Đèn chiếu rọi không gian nền */}
      <pointLight position={[0, 4, 0]} intensity={1.5} color="#818cf8" />
      <pointLight position={[-8, 6, -5]} intensity={1.2} color="#6366f1" />
      <pointLight position={[8, 6, -5]} intensity={1.2} color="#6366f1" />

      {/* Hạt bụi sáng lơ lửng trong không gian */}
      <Sparkles
        count={80}
        scale={[20, 10, 20]}
        size={2}
        speed={0.4}
        color="#fbbf24"
      />
    </group>
  );
}

"use client";

// Hậu kỳ: phát sáng (bloom) cho đèn/ngôi sao/viền vàng và tối dần viền khung hình (vignette)
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";

export default function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} radius={0.7} />
      <Vignette offset={0.22} darkness={0.72} />
      {/* Khi dùng EffectComposer, tone mapping của renderer không áp dụng → thêm ở cuối chuỗi */}
      <ToneMapping />
    </EffectComposer>
  );
}

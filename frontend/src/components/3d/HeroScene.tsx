import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Icosahedron } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function Orbit({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.x += delta * 0.12;
    ref.current.rotation.y += delta * 0.18;
  });

  return (
    <mesh ref={ref} rotation={[0.4, 0.1, 0.2]}>
      <torusGeometry
        args={[
          mobile ? 1.8 : 2.1,
          mobile ? 0.02 : 0.025,
          12,
          mobile ? 48 : 96,
        ]}
      />

      <meshStandardMaterial
        color="#f5a623"
        emissive="#6f2a05"
        emissiveIntensity={2.2}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
}

function Core({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.2}
      floatIntensity={0.8}
    >
      <Icosahedron
        ref={ref}
        args={[mobile ? 0.72 : 0.85, mobile ? 1 : 2]}
      >
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#8f2b09"
          emissiveIntensity={1.8}
          wireframe
        />
      </Icosahedron>
    </Float>
  );
}

export default function HeroScene() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");

    const update = () => setMobile(media.matches);

    update();
    media.addEventListener?.("change", update);

    return () => {
      media.removeEventListener?.("change", update);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] opacity-70"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 0, mobile ? 7 : 6],
          fov: mobile ? 52 : 45,
        }}
        dpr={mobile ? 1 : [1, 1.5]}
        gl={{
          antialias: !mobile,
          alpha: true,
          powerPreference: "high-performance",
        }}
        frameloop="always"
      >
        <ambientLight intensity={0.25} />

        <pointLight
          position={[2, 1, 4]}
          intensity={mobile ? 7 : 12}
          color="#f59e0b"
        />

        <pointLight
          position={[-3, -1, 2]}
          intensity={mobile ? 3 : 5}
          color="#ef4444"
        />

        <pointLight
          position={[0, 3, -2]}
          intensity={mobile ? 1 : 1.5}
          color="#ffd78a"
        />

        <Orbit mobile={mobile} />
        <Core mobile={mobile} />

        <Sparkles
          count={mobile ? 25 : 80}
          scale={mobile ? 6 : 8}
          size={mobile ? 1 : 1.5}
          speed={0.2}
          color="#ffd78a"
        />
      </Canvas>
    </div>
  );
}

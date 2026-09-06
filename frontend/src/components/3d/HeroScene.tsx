import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Icosahedron } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Orbit() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.x += delta * 0.12;
    ref.current.rotation.y += delta * 0.18;
  });

  return (
    <mesh ref={ref} rotation={[0.4, 0.1, 0.2]}>
      <torusGeometry args={[2.1, 0.025, 16, 96]} />
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

function Core() {
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
      <Icosahedron ref={ref} args={[0.85, 2]}>
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
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] opacity-70"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <ambientLight intensity={0.25} />

        <pointLight
          position={[2, 1, 4]}
          intensity={12}
          color="#f59e0b"
        />

        <pointLight
          position={[-3, -1, 2]}
          intensity={5}
          color="#ef4444"
        />

        <pointLight
          position={[0, 3, -2]}
          intensity={1.5}
          color="#ffd78a"
        />

        <Orbit />
        <Core />

        <Sparkles
          count={80}
          scale={8}
          size={1.5}
          speed={0.25}
          color="#ffd78a"
        />
      </Canvas>
    </div>
  );
}

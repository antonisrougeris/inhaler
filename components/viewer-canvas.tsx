"use client";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  useGLTF,
  Html,
} from "@react-three/drei";
import { Suspense, Component, type ReactNode } from "react";
function GLB({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}
function Demo({ color }: { color: string }) {
  return (
    <group rotation={[0.15, 0, -0.3]}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 2.5, 48]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.35, 48]} />
        <meshStandardMaterial
          color="#bcbeb3"
          metalness={0.85}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 1.535, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.2, 48]} />
        <meshStandardMaterial color="#bfc0b6" metalness={0.8} />
      </mesh>
      <Html position={[0.45, 0.1, 0]}>
        <span className="hotspot" title="Illustrative replaceable core">
          01
        </span>
      </Html>
    </group>
  );
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p>3D unavailable. Switch to 2D.</p>
    ) : (
      this.props.children
    );
  }
}
export default function ViewerCanvas({
  color,
  modelUrl,
}: {
  color: string;
  modelUrl?: string | null;
}) {
  return (
    <Boundary>
      <div className="canvas">
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [0, 1, 5], fov: 38 }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[3, 5, 4]} intensity={4} />
          <Suspense fallback={null}>
            {modelUrl ? <GLB url={modelUrl} /> : <Demo color={color} />}
            <ContactShadows position={[0, -1.5, 0]} opacity={0.25} blur={2.5} />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={3} maxDistance={7} />
        </Canvas>
      </div>
    </Boundary>
  );
}

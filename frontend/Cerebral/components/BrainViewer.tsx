/// <reference types="@react-three/fiber" />
import React, { Suspense, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, ThreeEvent, useFrame, MeshProps as R3FMeshProps } from '@react-three/fiber'; // Imported MeshProps
import { OrbitControls, useGLTF, Html, Line, Text } from '@react-three/drei'; // Added Text
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { BrainSectionId, OptionalBrainSectionId, BrainSectionConfig } from '../types.ts';
import { BRAIN_SECTION_CONFIGS, MODEL_PATH } from '../constants.tsx';

// Define R3FMeshProps using MeshProps from @react-three/fiber
// Removed: type R3FMeshProps = JSX.IntrinsicElements['mesh'];

interface BrainViewerProps {
  selectedSectionId: OptionalBrainSectionId;
  onSectionSelect: (sectionId: OptionalBrainSectionId) => void;
}

interface InteractiveBrainModelProps extends BrainViewerProps {
  onFocusTargetUpdate: (target: THREE.Vector3 | null) => void;
}

interface BrainSectionSphereCustomProps {
  sectionConfig: BrainSectionConfig;
  isSelected: boolean;
  isHovered: boolean;
  onSectionClick: (sectionId: BrainSectionId) => void;
  onPointerEnterSection: (sectionId: BrainSectionId) => void;
  onPointerLeaveSection: (sectionId: BrainSectionId) => void;
  originalMaterial?: THREE.Material | THREE.Material[];
}

// Combine custom props with R3FMeshProps.
type BrainSectionSphereProps = BrainSectionSphereCustomProps & Omit<R3FMeshProps, 'geometry'> & {
    geometry?: THREE.BufferGeometry; // Make geometry prop optional and specific
};


const BrainSectionSphere = React.forwardRef<THREE.Mesh, BrainSectionSphereProps>(({
  sectionConfig,
  isSelected,
  isHovered,
  onSectionClick,
  onPointerEnterSection,
  onPointerLeaveSection,
  originalMaterial,
  geometry, 
  ...otherMeshProps 
}, ref) => {
  const color = useMemo(() => {
    if (isSelected) return sectionConfig.highlightColor;
    if (isHovered) return new THREE.Color(sectionConfig.color).lerp(new THREE.Color(sectionConfig.highlightColor), 0.5).getHexString();
    return sectionConfig.color;
  }, [isSelected, isHovered, sectionConfig.color, sectionConfig.highlightColor]);

  return (
    <mesh
      {...otherMeshProps} 
      ref={ref}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSectionClick(sectionConfig.id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onPointerEnterSection(sectionConfig.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onPointerLeaveSection(sectionConfig.id);
        document.body.style.cursor = 'auto';
      }}
    >
      {geometry ? <primitive object={geometry} dispose={null} /> : <sphereGeometry args={[0.3, 32, 32]} />}

      <meshStandardMaterial
        color={color as THREE.ColorRepresentation}
        emissive={isSelected || isHovered ? (color as THREE.ColorRepresentation) : undefined}
        emissiveIntensity={isSelected ? 0.6 : isHovered ? 0.3 : 0}
        roughness={0.6}
        metalness={0.2}
        transparent={isHovered || isSelected}
        opacity={isHovered || isSelected ? 0.9 : (originalMaterial && 'opacity' in originalMaterial && typeof (originalMaterial as THREE.MeshStandardMaterial).opacity === 'number' ? (originalMaterial as THREE.MeshStandardMaterial).opacity : 1)}
        wireframe={!geometry} 
      />

      {(isSelected || isHovered) && (
         <Html position={[0, geometry ? 0.5 : 0.4, 0]} center>
           <div className="bg-gray-800 text-white text-xs p-1 rounded shadow-lg whitespace-nowrap">
             {sectionConfig.name}
           </div>
         </Html>
       )}
    </mesh>
  );
});


const InteractiveBrainModel: React.FC<InteractiveBrainModelProps> = ({ selectedSectionId, onSectionSelect, onFocusTargetUpdate }) => {
  const [hoveredSectionId, setHoveredSectionId] = useState<OptionalBrainSectionId>(null);
  const gltf = useGLTF(MODEL_PATH);
  const sectionMeshRefs = useRef<Record<string, THREE.Mesh | null>>({});
  const centralPoint = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const currentKeys = Object.keys(sectionMeshRefs.current);
    currentKeys.forEach(key => {
        if (!BRAIN_SECTION_CONFIGS.find(c => c.id === key)) {
            sectionMeshRefs.current[key] = null;
        }
    });
  }, []);

  useEffect(() => {
    if (selectedSectionId && sectionMeshRefs.current[selectedSectionId]) {
      const mesh = sectionMeshRefs.current[selectedSectionId];
      if (mesh) {
        const targetPosition = new THREE.Vector3();
        mesh.getWorldPosition(targetPosition);
        onFocusTargetUpdate(targetPosition);
      } else {
        const config = BRAIN_SECTION_CONFIGS.find(c => c.id === selectedSectionId);
        if (config) {
             onFocusTargetUpdate(config.position.clone());
        } else {
            onFocusTargetUpdate(null);
        }
      }
    } else {
      onFocusTargetUpdate(null);
    }
  }, [selectedSectionId, onFocusTargetUpdate]);


  const brainSections = useMemo(() => {
    return BRAIN_SECTION_CONFIGS.map(config => {
      const modelNode = gltf.nodes[config.id] as THREE.Mesh;

      if (!modelNode || !(modelNode instanceof THREE.Mesh) ) {
        console.warn(`Mesh for section "${config.id}" not found or not a Mesh in GLB. Rendering fallback sphere.`);
        return (
          <BrainSectionSphere
            key={config.id}
            ref={(el: THREE.Mesh | null) => { sectionMeshRefs.current[config.id] = el; }}
            sectionConfig={config}
            position={config.position} 
            scale={[1,1,1]} 
            isSelected={selectedSectionId === config.id}
            isHovered={hoveredSectionId === config.id}
            onSectionClick={onSectionSelect}
            onPointerEnterSection={setHoveredSectionId}
            onPointerLeaveSection={() => setHoveredSectionId(null)}
          />
        );
      }

      let originalMaterial = modelNode.material;
      if (Array.isArray(originalMaterial)) {
          originalMaterial = undefined;
      } else if (originalMaterial) {
          originalMaterial = originalMaterial.clone();
      }

      return (
        <BrainSectionSphere
          key={config.id}
          ref={(el: THREE.Mesh | null) => { sectionMeshRefs.current[config.id] = el; }}
          sectionConfig={config}
          name={modelNode.name} 
          position={modelNode.position.clone()}
          rotation={modelNode.rotation.clone()}
          scale={modelNode.scale.clone()}
          geometry={modelNode.geometry} 
          originalMaterial={originalMaterial}
          isSelected={selectedSectionId === config.id}
          isHovered={hoveredSectionId === config.id}
          onSectionClick={onSectionSelect}
          onPointerEnterSection={setHoveredSectionId}
          onPointerLeaveSection={() => setHoveredSectionId(null)}
        />
      );
    });
  }, [gltf.nodes, selectedSectionId, hoveredSectionId, onSectionSelect]);

  const connectionLines = useMemo(() => {
    return BRAIN_SECTION_CONFIGS.map(config => {
      const modelNode = gltf.nodes[config.id] as THREE.Mesh;
      const endPoint = (modelNode && modelNode instanceof THREE.Mesh)
                       ? modelNode.position.clone() 
                       : config.position.clone();   
      return (
        <Line
          key={`line-${config.id}`}
          points={[centralPoint, endPoint]}
          color="#6c757d"
          lineWidth={1.5}
          dashed={false}
        />
      );
    });
  }, [gltf.nodes, centralPoint]);

  return (
    <group dispose={null} scale={[2,2,2]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={centralPoint}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
            color="#007bff" // Blue color
            emissive="#0056b3" // Darker blue emissive
            emissiveIntensity={0.3}
            roughness={0.4}
            metalness={0.1}
        />
      </mesh>
      <Text
        position={[centralPoint.x, centralPoint.y, centralPoint.z + 0.01]} // Slight Z offset to ensure visibility
        rotation={[0, -Math.PI / 2, 0]} // Counter the group's rotation to face camera
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="black"
      >
        AI
      </Text>

      {brainSections}
      {connectionLines}
    </group>
  );
};

const CameraController: React.FC<{ controlsRef: React.RefObject<OrbitControlsImpl> }> = ({ controlsRef }) => {
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  return null; 
};

const BrainViewer: React.FC<BrainViewerProps> = ({ selectedSectionId, onSectionSelect }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  const handleFocusTargetUpdate = useCallback((target: THREE.Vector3 | null) => {
    if (controlsRef.current) {
      if (target) {
        controlsRef.current.target.copy(target);
      } else {
        controlsRef.current.target.set(0, 0, 0); 
      }
    }
  }, []);


  return (
    <Canvas
      camera={{ position: [0, 1, 5], fov: 50 }}
      shadows
      className="w-full h-full bg-transparent"
      aria-label="Interactive 3D Brain Model"
    >
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <Suspense fallback={
        <Html center>
            <div className="text-white text-lg p-4 bg-gray-700 rounded">Loading Brain Model...</div>
        </Html>
      }>
        <InteractiveBrainModel
          selectedSectionId={selectedSectionId}
          onSectionSelect={onSectionSelect}
          onFocusTargetUpdate={handleFocusTargetUpdate}
        />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={20}
      />
      <CameraController controlsRef={controlsRef} />
    </Canvas>
  );
};

export default BrainViewer;
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ParticleMorphismProps {
  className?: string;
  particleCount?: number;
  mouseInteraction?: boolean;
}

const ParticleMorphism = ({ 
  className = "", 
  particleCount = 1000,
  mouseInteraction = true 
}: ParticleMorphismProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const particlesRef = useRef<THREE.Points>();
  const mouseRef = useRef(new THREE.Vector2());
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Create particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    // Initialize particle positions in various shapes
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      if (i < particleCount * 0.3) {
        // Sphere formation
        const radius = Math.random() * 15 + 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
      } else if (i < particleCount * 0.6) {
        // Torus formation
        const majorRadius = 12;
        const minorRadius = 4;
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        
        positions[i3] = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
        positions[i3 + 1] = minorRadius * Math.sin(v);
        positions[i3 + 2] = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
      } else {
        // Wave formation
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        positions[i3] = x;
        positions[i3 + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 5;
        positions[i3 + 2] = z;
      }

      // Store original positions
      originalPositions[i3] = positions[i3];
      originalPositions[i3 + 1] = positions[i3 + 1];
      originalPositions[i3 + 2] = positions[i3 + 2];

      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Dynamic material colors based on theme
    const getParticleColor = () => {
      return isDarkMode ? 0x8b5cf6 : 0x6366f1; // Purple for dark, indigo for light
    };

    const material = new THREE.PointsMaterial({
      color: getParticleColor(),
      size: 2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 30;

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    particlesRef.current = particles;

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseInteraction) return;
      
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Morphing animation
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Base oscillation
        const oscillation = Math.sin(elapsedTime * 0.5 + i * 0.01) * 0.5;
        
        // Mouse influence
        if (mouseInteraction) {
          const mouseInfluence = 5;
          const mouseX = mouseRef.current.x * 20;
          const mouseY = mouseRef.current.y * 20;
          
          const dx = positions[i3] - mouseX;
          const dy = positions[i3 + 1] - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 10) {
            const force = (10 - distance) / 10;
            positions[i3] += dx * force * 0.02;
            positions[i3 + 1] += dy * force * 0.02;
          }
        }
        
        // Return to original position with oscillation
        positions[i3] += (originalPositions[i3] - positions[i3]) * 0.02 + velocities[i3] + oscillation * 0.1;
        positions[i3 + 1] += (originalPositions[i3 + 1] - positions[i3 + 1]) * 0.02 + velocities[i3 + 1];
        positions[i3 + 2] += (originalPositions[i3 + 2] - positions[i3 + 2]) * 0.02 + velocities[i3 + 2];
        
        // Morphing between shapes
        const morphProgress = (Math.sin(elapsedTime * 0.2) + 1) * 0.5;
        
        if (i < particleCount * 0.3) {
          // Morph sphere to cube
          const cubeSize = 10;
          const cubeX = (Math.random() - 0.5) * cubeSize;
          const cubeY = (Math.random() - 0.5) * cubeSize;
          const cubeZ = (Math.random() - 0.5) * cubeSize;
          
          positions[i3] = THREE.MathUtils.lerp(originalPositions[i3], cubeX, morphProgress * 0.3);
          positions[i3 + 1] = THREE.MathUtils.lerp(originalPositions[i3 + 1], cubeY, morphProgress * 0.3);
          positions[i3 + 2] = THREE.MathUtils.lerp(originalPositions[i3 + 2], cubeZ, morphProgress * 0.3);
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      
      // Rotate the entire particle system
      particles.rotation.y += 0.001;
      particles.rotation.x += 0.0005;
      
      // Update material color based on theme
      material.color.setHex(getParticleColor());
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [particleCount, mouseInteraction, isDarkMode]);

  return (
    <div 
      ref={mountRef} 
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default ParticleMorphism;
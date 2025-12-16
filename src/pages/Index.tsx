import { useState, useEffect, useRef } from 'react';
import { useHandTracking, GestureState } from '@/hooks/useHandTracking';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import Scene3D from '@/components/Scene3D';
import Header from '@/components/Header';
import GestureIndicator from '@/components/GestureIndicator';
import MiniCameraOverlay from '@/components/MiniCameraOverlay';
import ModelSelector from '@/components/ModelSelector';
import GestureGuide from '@/components/GestureGuide';

type ModelType = 'torus' | 'sphere' | 'cube' | 'icosahedron' | 'car' | 'chair' | 'solar';

const Index = () => {
  const [modelType, setModelType] = useState<ModelType>('solar');
  const { videoRef, canvasRef, isTracking, gesture, startTracking } = useHandTracking();
  const { playSound } = useSoundEffects();
  const prevGesture = useRef<GestureState | null>(null);

  // Auto-start tracking when refs are ready
  useEffect(() => {
    const timer = setTimeout(() => {
      startTracking();
    }, 100);
    return () => clearTimeout(timer);
  }, [startTracking]);

  // Play sounds based on gesture changes
  useEffect(() => {
    if (!prevGesture.current) {
      prevGesture.current = gesture;
      return;
    }

    const prev = prevGesture.current;

    if (!prev.isZoomIn && gesture.isZoomIn) playSound('zoom');
    if (!prev.isZoomOut && gesture.isZoomOut) playSound('zoom');
    if (!prev.isOpenHand && gesture.isOpenHand) playSound('rotate', 1000);
    if (!prev.isPeace && gesture.isPeace) playSound('move', 1000);
    if (!prev.isFist && gesture.isFist) playSound('freeze');
    if (!prev.isReset && gesture.isReset) playSound('reset');

    prevGesture.current = gesture;
  }, [gesture, playSound]);

  // Play sound on model change
  const handleModelChange = (type: ModelType) => {
    playSound('select');
    setModelType(type);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card opacity-50" />
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      {/* 3D Scene */}
      <Scene3D gesture={gesture} modelType={modelType} />

      {/* Header */}
      <Header />

      {/* Gesture Guide - Top Right */}
      <GestureGuide />

      {/* Model Selector - centered bottom navigation */}
      <ModelSelector modelType={modelType} onModelChange={handleModelChange} />

      {/* Mini Camera Overlay - small corner */}
      <MiniCameraOverlay
        videoRef={videoRef}
        canvasRef={canvasRef}
        isTracking={isTracking}
      />

      {/* Gesture Indicator */}
      <GestureIndicator gesture={gesture} isTracking={isTracking} />
    </div>
  );
};

export default Index;

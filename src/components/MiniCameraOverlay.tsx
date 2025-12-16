import { RefObject } from 'react';

interface MiniCameraOverlayProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isTracking: boolean;
}

const MiniCameraOverlay = ({
  videoRef,
  canvasRef,
  isTracking,
}: MiniCameraOverlayProps) => {
  return (
    <div className="absolute bottom-20 left-4 z-20">
      <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-primary/30 bg-background/30 backdrop-blur-sm shadow-lg shadow-primary/10">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Tracking indicator dot */}
        <div
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            isTracking ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
          }`}
        />
      </div>
    </div>
  );
};

export default MiniCameraOverlay;

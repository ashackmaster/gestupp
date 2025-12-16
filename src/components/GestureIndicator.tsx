import { GestureState } from '@/hooks/useHandTracking';
import { Hand, ZoomIn, ZoomOut, Move, Snowflake, RotateCcw } from 'lucide-react';

interface GestureIndicatorProps {
  gesture: GestureState;
  isTracking: boolean;
}

const GestureIndicator = ({ gesture, isTracking }: GestureIndicatorProps) => {
  if (!isTracking) return null;

  const activeGesture = gesture.isZoomIn
    ? { icon: ZoomIn, label: 'ZOOM IN', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' }
    : gesture.isZoomOut
    ? { icon: ZoomOut, label: 'ZOOM OUT', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' }
    : gesture.isPeace
    ? { icon: Move, label: 'POSITION', color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' }
    : gesture.isOpenHand
    ? { icon: Hand, label: 'ROTATE', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' }
    : gesture.isFist
    ? { icon: Snowflake, label: 'FREEZE', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' }
    : gesture.isReset
    ? { icon: RotateCcw, label: 'RESET', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
    : null;

  if (!activeGesture) return null;

  const Icon = activeGesture.icon;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${activeGesture.bg} backdrop-blur-sm border ${activeGesture.border}`}>
        <Icon className={`w-4 h-4 ${activeGesture.color}`} />
        <span className={`text-xs font-display tracking-widest ${activeGesture.color}`}>
          {activeGesture.label}
        </span>
      </div>
    </div>
  );
};

export default GestureIndicator;

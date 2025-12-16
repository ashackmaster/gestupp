import { useState } from 'react';
import { Hand, ZoomIn, ZoomOut, Move, Snowflake, RotateCcw, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GestureGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20">
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-background/40 backdrop-blur-md border border-border/30 shadow-lg hover:bg-background/60"
      >
        {isOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </Button>

      {/* Gesture Guide Panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 p-3 rounded-xl bg-background/40 backdrop-blur-md border border-border/30 shadow-lg animate-fade-in min-w-[180px]">
          <h4 className="text-[10px] font-semibold text-foreground/70 mb-2 uppercase tracking-wider">Gestures</h4>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-cyan-400">
              <Hand className="w-3.5 h-3.5" />
              <span className="text-[10px]">Open Hand - Rotate</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <ZoomIn className="w-3.5 h-3.5" />
              <span className="text-[10px]">Thumb+Index - Zoom In</span>
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <ZoomOut className="w-3.5 h-3.5" />
              <span className="text-[10px]">Index Only - Zoom Out</span>
            </div>
            <div className="flex items-center gap-2 text-pink-400">
              <Move className="w-3.5 h-3.5" />
              <span className="text-[10px]">Peace Sign - Move</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Snowflake className="w-3.5 h-3.5" />
              <span className="text-[10px]">Fist - Freeze</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px]">Thumb+Pinky - Reset</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureGuide;

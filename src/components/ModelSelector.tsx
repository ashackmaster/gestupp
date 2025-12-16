import { Button } from '@/components/ui/button';
import { Circle, Box, Triangle, Car, Armchair, Globe } from 'lucide-react';

type ModelType = 'torus' | 'sphere' | 'cube' | 'icosahedron' | 'car' | 'chair' | 'solar';

interface ModelSelectorProps {
  modelType: ModelType;
  onModelChange: (type: ModelType) => void;
}

const ModelSelector = ({ modelType, onModelChange }: ModelSelectorProps) => {
  const models: { type: ModelType; icon: typeof Circle; label: string }[] = [
    { type: 'torus', icon: Circle, label: 'Torus' },
    { type: 'sphere', icon: Circle, label: 'Sphere' },
    { type: 'cube', icon: Box, label: 'Cube' },
    { type: 'icosahedron', icon: Triangle, label: 'Icosahedron' },
    { type: 'car', icon: Car, label: 'Car' },
    { type: 'chair', icon: Armchair, label: 'Chair' },
    { type: 'solar', icon: Globe, label: 'Solar System' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="flex gap-1 p-2 rounded-2xl bg-background/40 backdrop-blur-md border border-border/30 shadow-lg shadow-primary/5">
        {models.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            className={`px-3 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              modelType === type
                ? 'bg-primary/20 text-primary shadow-md shadow-primary/20 border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            onClick={() => onModelChange(type)}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;

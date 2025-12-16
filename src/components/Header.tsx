import { Fingerprint, Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="absolute top-6 left-6 z-20">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Fingerprint className="w-10 h-10 text-primary" />
          <Sparkles className="w-4 h-4 text-secondary absolute -top-1 -right-1" />
        </div>
        <div>
          <h1 className="font-display text-xl tracking-wider neon-text">
            GESTURE 3D
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest">
            HAND TRACKING INTERFACE
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;

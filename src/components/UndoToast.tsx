import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        onDismiss();
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-0 overflow-hidden rounded-lg shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-4 bg-gray-900 px-4 py-3 text-white sm:min-w-[300px]">
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-white/20 hover:text-blue-300"
        >
          <RotateCcw className="h-4 w-4" />
          Undo
        </button>
        <button
          onClick={onDismiss}
          className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 w-full bg-gray-800">
        <div
          className="h-full bg-blue-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function ErrorFallback({ error, reset, title = 'Une erreur est survenue' }: Props) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-400">
        Quelque chose s&apos;est mal passé. Réessaie ou reviens plus tard.
      </p>
      {error.digest && (
        <p className="mt-2 text-[10px] text-gray-300">Ref: {error.digest}</p>
      )}
      <Button
        onClick={reset}
        variant="outline"
        size="sm"
        className="mt-4"
      >
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Réessayer
      </Button>
    </div>
  );
}

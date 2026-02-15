'use client';

import { ErrorFallback } from '@/components/ui/error-boundary';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback error={error} reset={reset} title="Erreur sur les matchs" />;
}

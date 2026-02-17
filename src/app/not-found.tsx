import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center">
      <div className="text-6xl">🎾</div>
      <h1 className="mt-6 text-3xl font-bold text-white">Page introuvable</h1>
      <p className="mt-3 text-gray-400">
        La page que tu cherches n&apos;existe pas ou a ete deplacee.
      </p>
      <Link
        href="/accueil"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-padel px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-padel-light"
      >
        Retour a l&apos;accueil
      </Link>
    </div>
  );
}

import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Image
            src="/logo-remove.png"
            alt="Padelia"
            width={200}
            height={60}
            className="mx-auto"
            priority
          />
          <p className="mt-2 text-sm text-gray-400">
            Joue mieux, plus souvent, avec les bons partenaires.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

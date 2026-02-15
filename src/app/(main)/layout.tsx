import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import GeolocationPermission from '@/components/layout/GeolocationPermission';
import PushPermission from '@/components/layout/PushPermission';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <PushPermission />
      <GeolocationPermission />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-20 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

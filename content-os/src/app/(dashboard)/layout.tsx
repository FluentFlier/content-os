import { headers } from 'next/headers';
import Sidebar from '@/components/nav/Sidebar';
import BottomBar from '@/components/nav/BottomBar';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';

  if (pathname === '/teleprompter') {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-bg-primary">
        <Sidebar />
        <main className="flex-1 md:ml-[220px] overflow-y-auto overflow-x-hidden px-4 md:px-[28px] py-[24px] pb-20 md:pb-[24px] min-w-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <BottomBar />
      </div>
    </ToastProvider>
  );
}

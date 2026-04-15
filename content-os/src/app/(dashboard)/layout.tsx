import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/nav/Sidebar';
import BottomBar from '@/components/nav/BottomBar';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';

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

  // Redirect new users to onboarding before any dashboard page.
  // Skip the check when already on /onboarding to prevent a redirect loop.
  if (pathname !== '/onboarding') {
    const user = await getAuthenticatedUser();
    if (user) {
      try {
        const client = getServerClient();
        const { data: profile } = await client.database
          .from('creator_profile')
          .select('onboarding_complete')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.onboarding_complete) {
          redirect('/onboarding');
        }
      } catch {
        // On error let them through to avoid a redirect loop
      }
    }
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

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import Sidebar from '@/components/nav/Sidebar';
import BottomBar from '@/components/nav/BottomBar';
import { ToastProvider } from '@/components/ui/Toast';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';

  // Check onboarding: skip for /onboarding and /settings routes
  const skipOnboarding =
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/settings');
  if (!skipOnboarding) {
    let hasProfile = false;
    try {
      const client = getServerClient();
      const { data: profileRow } = await client.database
        .from('creator_profile')
        .select('id, onboarding_complete')
        .eq('user_id', user.id)
        .single();
      hasProfile = Boolean(profileRow?.onboarding_complete);
    } catch {
      // Query failed (no row found) - treat as no profile
    }
    if (!hasProfile) {
      redirect('/onboarding');
    }
  }

  if (pathname === '/teleprompter') {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#FFFFFF]">
        <Sidebar />
        <main className="flex-1 md:ml-[240px] overflow-y-auto px-[28px] py-[24px] pb-20 md:pb-[24px]">
          {children}
        </main>
        <BottomBar />
      </div>
    </ToastProvider>
  );
}

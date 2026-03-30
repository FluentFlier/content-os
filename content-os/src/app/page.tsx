import { getAuthenticatedUser } from '@/lib/insforge/server';
import LandingPageContent from '@/components/landing/LandingPageContent';

export default async function LandingPage() {
  const user = await getAuthenticatedUser();
  const loggedIn = Boolean(user);

  return <LandingPageContent loggedIn={loggedIn} />;
}

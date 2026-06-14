// src/app/(app)/dashboard/page.tsx
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardContainer } from './DashboardContainer';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <DashboardContainer session={session} />;
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { interviewStore } from '@/lib/store/interviewStore';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (user?.email) {
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
      });

      if (dbUser) {
        const isSubscribed = Boolean(
          dbUser.subscriptionUntil && new Date(dbUser.subscriptionUntil) > new Date()
        );

        return NextResponse.json({
          sessionsRemaining: dbUser.credits ?? 1,
          plan: isSubscribed ? 'pro' : 'free',
          subscriptionUntil: dbUser.subscriptionUntil,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching balance from DB:', err);
  }

  const data = interviewStore.getUserDashboardData();
  return NextResponse.json(data);
}


import { NextResponse } from 'next/server';
import { interviewStore } from '@/lib/store/interviewStore';

export async function GET() {
  const data = interviewStore.getUserDashboardData();
  return NextResponse.json(data);
}

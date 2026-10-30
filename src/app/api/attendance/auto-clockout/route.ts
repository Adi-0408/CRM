import { NextRequest, NextResponse } from 'next/server';
import { processAutoClockOuts } from '@/lib/autoClockOutService';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const result = await processAutoClockOuts();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const result = await processAutoClockOuts();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

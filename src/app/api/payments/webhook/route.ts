import { NextRequest, NextResponse } from 'next/server';
import { Company } from '@/models/Company';
import { Subscription } from '@/models/Subscription';
import { Payment } from '@/models/Payment';
import { AuditLog } from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature if secret configured
    if (secret && signature) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expected !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    await connectToDatabase();

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const companyId = notes.companyId;
      const planId = notes.planId;

      if (companyId) {
        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let sub = await Subscription.findOne({ companyId });
        if (sub) {
          await Subscription.findByIdAndUpdate(sub._id || sub.id, {
            status: 'active',
            paymentStatus: 'paid',
            endDate: endDate.toISOString(),
            updatedAt: now.toISOString(),
          });
        }

        await Company.findByIdAndUpdate(companyId, {
          subscriptionStatus: 'active',
          ...(planId ? { planId } : {}),
        });

        await Payment.create({
          companyId,
          subscriptionId: sub ? String(sub._id || sub.id) : '',
          amount: Number(paymentEntity.amount || 0) / 100,
          currency: paymentEntity.currency || 'INR',
          paymentGateway: 'razorpay',
          gatewayPaymentId: paymentEntity.id,
          status: 'paid',
          paidAt: now.toISOString(),
        });
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

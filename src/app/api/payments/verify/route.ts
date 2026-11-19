import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/apiAuth';
import { Plan } from '@/models/Plan';
import { Company } from '@/models/Company';
import { Subscription } from '@/models/Subscription';
import { Payment } from '@/models/Payment';
import { AuditLog } from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID missing from session' }, { status: 400 });
    }

    const body = await req.json();
    const { orderId, paymentId, signature, planId, billingCycle = 'monthly' } = body;

    if (!paymentId || !planId) {
      return NextResponse.json({ error: 'paymentId and planId are required' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (secret && signature && orderId) {
      const generated = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generated !== signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    await connectToDatabase();
    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const amountInRupees = billingCycle === 'yearly' ? plan.price * 10 : plan.price;

    // 1. Calculate new end date
    const now = new Date();
    const durationDays = billingCycle === 'yearly' ? 365 : 30;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 2. Update or create subscription
    let sub = await Subscription.findOne({ companyId });
    if (sub) {
      await Subscription.findByIdAndUpdate(sub._id || sub.id, {
        planId,
        status: 'active',
        paymentStatus: 'paid',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        gracePeriodEnd: new Date(endDate.getTime() + 7 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      });
    } else {
      sub = await Subscription.create({
        companyId,
        planId,
        status: 'active',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        paymentStatus: 'paid',
        autoRenew: true,
      });
    }

    // 3. Update company
    await Company.findByIdAndUpdate(companyId, {
      planId,
      subscriptionStatus: 'active',
    });

    // 4. Create Payment record
    const payment = await Payment.create({
      companyId,
      subscriptionId: String(sub._id || sub.id),
      amount: amountInRupees,
      currency: 'INR',
      paymentGateway: 'razorpay',
      gatewayPaymentId: paymentId,
      razorpayOrderId: orderId || '',
      razorpayPaymentId: paymentId,
      razorpaySignature: signature || '',
      status: 'paid',
      paidAt: now.toISOString(),
    });

    // 5. Create Audit Log
    try {
      await AuditLog.create({
        actorEmail: user.email,
        actorRole: user.role,
        action: 'PAYMENT_COMPLETED',
        target: `Plan ${plan.name} (${billingCycle})`,
        companyId,
        details: { amount: amountInRupees, paymentId },
        timestamp: now.toISOString(),
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Subscription to ${plan.name} activated successfully until ${endDate.toDateString()}.`,
      subscriptionId: String(sub._id || sub.id),
      paymentId: String(payment._id || payment.id),
    });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}

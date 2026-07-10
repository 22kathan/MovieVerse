import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const tiers = {
  monthly: {
    name: 'MovieVerse VIP Pass (1 Month)',
    description: 'Unlock exclusive features and an ad-free experience for 30 days.',
    unit_amount: 5900, // ₹59.00 in paise
  },
  yearly: {
    name: 'MovieVerse VIP Pass (1 Year)',
    description: '12 months of VIP access at a discounted rate.',
    unit_amount: 59900, // ₹599.00 in paise
  },
  lifetime: {
    name: 'MovieVerse VIP Lifetime Pass',
    description: 'One-time payment for permanent VIP access.',
    unit_amount: 199900, // ₹1999.00 in paise
  },
};

export async function POST(request: Request) {
  try {
    const { tierId } = (await request.json()) as { tierId: keyof typeof tiers };
    const selectedTier = tiers[tierId];

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!selectedTier) {
      return NextResponse.json({ error: 'Invalid pricing tier selected.' }, { status: 400 });
    }

    const headersList = headers();
    const origin = headersList.get('origin') || 'http://localhost:3000';

    // Create a Stripe Customer if one doesn't exist and save the ID
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email!, name: user.name });
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }

    // Create a Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'upi'],
      line_items: [{ price_data: { currency: 'inr', product_data: { name: selectedTier.name, description: selectedTier.description }, unit_amount: selectedTier.unit_amount }, quantity: 1 }],
      mode: 'payment',
      customer: stripeCustomerId,
      metadata: { userId: user.id, tierId: tierId },
      success_url: `${origin}/premium?status=success`,
      cancel_url: `${origin}/premium?status=cancelled`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/auth';

const TIERS: Record<string, { amount: number; priceEnv: string }> = {
  '5':  { amount: 200,  priceEnv: 'STRIPE_PRICE_ID_5' },
  '10': { amount: 500,  priceEnv: 'STRIPE_PRICE_ID_10' },
  '25': { amount: 1500, priceEnv: 'STRIPE_PRICE_ID_25' },
};

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const tier = String(form.get('tier') || '');
  const t = TIERS[tier];
  if (!t) {
    return NextResponse.json({ error: 'unknown tier' }, { status: 400 });
  }

  const session = await readSession();

  // Сохраняем pending donation в БД — даже если Stripe ещё не настроен,
  // можно вручную пометить как succeeded (через будущую админку).
  const donation = await prisma.donation.create({
    data: {
      userId: session?.uid,
      amount: t.amount,
      currency: 'RUB',
      status: 'pending',
    },
  });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env[t.priceEnv];

  if (!stripeKey || !priceId) {
    // Stripe не настроен — показываем заглушку.
    const u = new URL('/donate/setup-required', req.nextUrl);
    u.searchParams.set('donationId', donation.id);
    return NextResponse.redirect(u, { status: 303 });
  }

  // Stripe настроен — создаём checkout session.
  const successUrl = new URL('/donate/success', req.nextUrl).toString();
  const cancelUrl = new URL('/donate', req.nextUrl).toString();

  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('line_items[0][price]', priceId);
  body.set('line_items[0][quantity]', '1');
  body.set('success_url', `${successUrl}?session_id={CHECKOUT_SESSION_ID}`);
  body.set('cancel_url', cancelUrl);
  body.set('metadata[donationId]', donation.id);

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!r.ok) {
    const text = await r.text();
    console.error('Stripe error', text);
    return NextResponse.json({ error: 'stripe_failed' }, { status: 502 });
  }

  const data = (await r.json()) as { id: string; url: string };
  await prisma.donation.update({
    where: { id: donation.id },
    data: { externalId: data.id },
  });

  return NextResponse.redirect(data.url, { status: 303 });
}

'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm() {
  const params = useSearchParams();
  const service = params.get('service') || '';
  const tier = params.get('tier') || '';
  const amount = parseInt(params.get('amount') || '0');

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceName: service, tierName: tier, amount }),
    });
    const data = await res.json();
    return data.clientSecret;
  }, [service, tier, amount]);

  if (!service || !amount) {
    return (
      <div className="bg-white/80 rounded-3xl p-8 text-center shadow-lg">
        <p className="text-gray-500 mb-4">No product selected.</p>
        <a href="/" className="text-blue-500 font-bold hover:underline">
          Back to Shop
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto mb-6">
        <a href="/" className="text-gray-500 hover:text-gray-700 text-sm font-bold">
          ← Back to Shop
        </a>
      </div>
      <div id="checkout" className="max-w-lg mx-auto">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: 'linear-gradient(180deg, #c4dff0 0%, #d4c4f0 100%)' }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-gray-500 font-bold">Loading checkout...</p>
          </div>
        }
      >
        <CheckoutForm />
      </Suspense>
    </div>
  );
}

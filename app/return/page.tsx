'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ReturnContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  return (
    <div
      className="bg-white/80 rounded-3xl p-8 md:p-12 max-w-md w-full mx-4 text-center shadow-lg"
      style={{ border: '2px solid rgba(255,255,255,0.9)' }}
    >
      {status === 'loading' && (
        <p className="text-gray-500 text-lg">Loading...</p>
      )}
      {status === 'success' && (
        <>
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-gray-700 font-black text-2xl mb-2">Payment Received!</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Thank you for your purchase. I&apos;ll be in touch shortly to get started on your project.
          </p>
          <a
            href="/"
            className="inline-block py-3 px-8 rounded-xl font-bold text-white text-sm shadow-md transition-transform hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            Back to Home
          </a>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-gray-700 font-black text-2xl mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-6">
            No worries — reach out at jordan@jdlo.online and we&apos;ll sort it out.
          </p>
          <a
            href="/"
            className="inline-block py-3 px-8 rounded-xl font-bold text-white text-sm shadow-md"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            Back to Home
          </a>
        </>
      )}
    </div>
  );
}

export default function ReturnPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #c4dff0 0%, #d4c4f0 100%)' }}
    >
      <Suspense fallback={<p className="text-gray-500 text-lg">Loading...</p>}>
        <ReturnContent />
      </Suspense>
    </div>
  );
}

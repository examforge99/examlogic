'use client';

import { useState } from 'react';

type Result = {
  status: number;
  body: unknown;
};

export default function NBATestPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function fire() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/nba/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      const body = await response.json().catch(() => null);
      setResult({ status: response.status, body });
    } catch (error) {
      setResult({
        status: 0,
        body: { error: error instanceof Error ? error.message : 'Request failed.' },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0D1117',
        color: '#F3F4F6',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ color: '#4FD1C5', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          ExamLogic / Internal
        </p>
        <h1 style={{ margin: '8px 0', fontSize: 30 }}>NBA Runtime Test</h1>
        <p style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
          Fires the production NBA endpoint using the current Clerk session.
          No user ID is sent from the browser.
        </p>

        <button
          type="button"
          onClick={fire}
          disabled={loading}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '15px 18px',
            border: 0,
            borderRadius: 10,
            background: '#4FD1C5',
            color: '#08110F',
            fontWeight: 700,
            fontSize: 16,
            opacity: loading ? 0.65 : 1,
          }}
        >
          {loading ? 'Firing NBA…' : 'Fire NBA'}
        </button>

        {result && (
          <section style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 10, fontWeight: 700 }}>
              HTTP {result.status}
            </div>
            <pre
              style={{
                margin: 0,
                padding: 16,
                overflowX: 'auto',
                borderRadius: 10,
                background: '#151B23',
                color: '#D1D5DB',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {JSON.stringify(result.body, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}

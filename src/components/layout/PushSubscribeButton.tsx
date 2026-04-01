'use client';

import { usePushSubscription } from '@/hooks/usePushSubscription';

export default function PushSubscribeButton() {
  const { isSubscribed, isSupported, loading, subscribeToPush } = usePushSubscription();

  if (!isSupported) return null;

  return (
    <button 
      onClick={isSubscribed ? undefined : subscribeToPush}
      disabled={loading || isSubscribed === true}
      style={{
        background: isSubscribed ? 'var(--accent-success-light)' : 'var(--brand-primary)',
        color: isSubscribed ? 'var(--accent-success)' : '#fff',
        border: isSubscribed ? '1px solid var(--accent-success)' : 'none',
        padding: '10px 20px',
        borderRadius: 'var(--radius-full)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: (isSubscribed || loading) ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: loading ? 0.7 : 1,
        boxShadow: isSubscribed ? 'none' : 'var(--shadow-sm)'
      }}
    >
      <span style={{ fontSize: '18px' }}>{isSubscribed ? '✅' : '🔔'}</span>
      {loading ? 'Checking...' : isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
    </button>
  );
}

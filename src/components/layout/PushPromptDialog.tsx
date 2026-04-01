'use client';

import { useState, useEffect } from 'react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useSession } from 'next-auth/react';

export default function PushPromptDialog() {
  const { data: session } = useSession();
  const { isSubscribed, isSupported, subscribeToPush } = usePushSubscription();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show to logged-in users who haven't subscribed, and support pushes
    if (!session?.user || isSupported === false || isSubscribed !== false) {
      return;
    }

    // Check if we've already prompted them recently
    const dismissedAt = localStorage.getItem('pushPromptDismissedAt');
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      // Wait at least 3 days before prompting again if they dismissed it
      if (daysSinceDismiss < 3) return;
    }

    // Show prompt after a small delay to not overwhelm on initial load
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [session, isSubscribed, isSupported]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pushPromptDismissedAt', Date.now().toString());
  };

  const handleEnable = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99998,
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={handleDismiss}
      />
      
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '420px',
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-full)',
            background: 'var(--brand-light)', color: 'var(--brand-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0
          }}>
            🔔
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Enable Notifications
            </h3>
            <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Stay updated immediately when new premium Apple IDs are added or passwords are changed.
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            onClick={handleDismiss}
            style={{
              flex: 1, padding: '12px', background: 'var(--bg-inset)',
              color: 'var(--text-primary)', border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Not Now
          </button>
          <button 
            onClick={handleEnable}
            style={{
              flex: 1, padding: '12px', background: 'var(--brand-gradient, var(--brand-primary))',
              color: 'white', border: 'none',
              borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: 'pointer',
              transition: 'transform 0.2s', boxShadow: 'var(--shadow-md)'
            }}
          >
            Yes, Enable
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}} />
    </>
  );
}

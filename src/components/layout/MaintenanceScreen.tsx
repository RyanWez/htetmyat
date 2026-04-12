'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MaintenanceScreenProps {
  message: string | null;
  endTime: string | null;
}

export default function MaintenanceScreen({ message, endTime }: MaintenanceScreenProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const target = new Date(endTime).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card"
        style={{
          maxWidth: '600px',
          width: '100%',
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--accent-color, #0070f3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0, 112, 243, 0.4)',
            marginBottom: '1rem',
          }}
        >
          {/* Settings / Wrench SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </motion.div>

        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Site Under Maintenance
        </h1>

        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
          {message || 'We are currently upgrading our systems to serve you better. Please check back shortly.'}
        </p>

        {timeLeft && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hrs', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes },
              { label: 'Secs', value: timeLeft.seconds },
            ].map((unit, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'var(--bg-inset)',
                  padding: '1rem',
                  borderRadius: '12px',
                  minWidth: '70px',
                  border: '1px solid var(--border-default)',
                }}
              >
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {unit.value.toString().padStart(2, '0')}
                </span>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginTop: '0.25rem' }}>
                  {unit.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => window.location.reload()}
            className="action-button"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Refresh Page
          </button>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { updateSystemSettings } from '@/app/admin/settings/actions';
import { motion, AnimatePresence } from 'framer-motion';

interface props {
  initialSettings: {
    maintenance_mode: boolean;
    maintenance_message: string | null;
    maintenance_end_time: string | null;
  };
}

export default function SystemSettingsCard({ initialSettings }: props) {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccess(false);
    try {
      const res = await updateSystemSettings({
        maintenance_mode: settings.maintenance_mode,
        maintenance_message: settings.maintenance_message,
        maintenance_end_time: settings.maintenance_end_time || null,
      });
      if (res.success) {
        setSuccess(true);
      } else {
        alert(res.error || 'Failed to save settings');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>System Configuration</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: 0 }}>
          Manage global site behavior, offline modes, and maintenance schedules.
        </p>
      </div>

      <div style={{ background: 'var(--bg-inset)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Toggle Switch Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Maintenance Mode</h3>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              Redirect public visitors to a maintenance screen. Admins retain access.
            </span>
          </div>
          
          <div 
            onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
            style={{
              width: '44px',
              height: '24px',
              background: settings.maintenance_mode ? 'var(--color-success, #22c55e)' : 'rgba(255,255,255,0.1)',
              borderRadius: '24px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.3s',
              flexShrink: 0,
            }}
          >
            <motion.div
              layout
              style={{
                width: '18px',
                height: '18px',
                background: '#ffffff',
                borderRadius: '50%',
                position: 'absolute',
                top: '3px',
                left: settings.maintenance_mode ? '23px' : '3px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              transition={{ type: 'spring', stiffness: 700, damping: 30 }}
            />
          </div>
        </div>

        <AnimatePresence>
          {settings.maintenance_mode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}
            >
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Maintenance Message
                </label>
                <textarea
                  value={settings.maintenance_message || ''}
                  onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                  placeholder="e.g. We are performing scheduled upgrades..."
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--brand-primary, #9333ea)'}
                  onBlur={(e) => e.target.style.border = '1px solid var(--border-default)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Expected End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={settings.maintenance_end_time ? new Date(new Date(settings.maintenance_end_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const dateInfo = e.target.value ? new Date(e.target.value).toISOString() : null;
                    setSettings({ ...settings, maintenance_end_time: dateInfo });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    colorScheme: 'dark'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--brand-primary, #9333ea)'}
                  onBlur={(e) => e.target.style.border = '1px solid var(--border-default)'}
                />
                <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  A countdown timer will be shown to users if an end time is set.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
        <AnimatePresence>
          {success && (
            <motion.span 
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              Settings Saved
            </motion.span>
          )}
        </AnimatePresence>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--brand-primary, #6366f1)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
            cursor: isSaving ? 'wait' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.2)'
          }}
          onMouseOver={(e) => { if (!isSaving) e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; }}
        >
          {isSaving ? (
            <>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Saving...
            </>
          ) : 'Save Configuration'}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { updateSystemSettings } from '@/app/admin/settings/actions';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/admin/settings/settings.module.css';

interface props {
  initialSettings: {
    maintenance_mode: boolean;
    maintenance_message: string | null;
    maintenance_end_time: string | null;
    max_devices_default: number;
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
        max_devices_default: settings.max_devices_default,
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
    <div className={styles.systemCard}>
      {/* ── Maintenance Mode ── */}
      <div className={styles.configBlock}>
        <div className={styles.configHeader}>
          <div className={styles.configTitle}>
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              Maintenance Mode
            </h3>
            <span>Redirect visitors to a maintenance screen. Admins retain full access.</span>
          </div>

          <div 
            className={`${styles.toggle} ${settings.maintenance_mode ? styles.active : ''}`}
            onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
          >
            <motion.div
              className={styles.toggleKnob}
              animate={{ left: settings.maintenance_mode ? '23px' : '3px' }}
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
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.maintenanceExpanded}>
                <div className={styles.formField}>
                  <label>Maintenance Message</label>
                  <textarea
                    value={settings.maintenance_message || ''}
                    onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                    placeholder="e.g. We are performing scheduled upgrades..."
                  />
                </div>

                <div className={styles.formField}>
                  <label>Expected End Time</label>
                  <input
                    type="datetime-local"
                    value={settings.maintenance_end_time ? new Date(new Date(settings.maintenance_end_time).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const dateInfo = e.target.value ? new Date(e.target.value).toISOString() : null;
                      setSettings({ ...settings, maintenance_end_time: dateInfo });
                    }}
                  />
                  <span className="hint">A countdown timer will be shown to users if set.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Device Limit ── */}
      <div className={styles.configBlock}>
        <div className={styles.configHeader}>
          <div className={styles.configTitle}>
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Device Limit
            </h3>
            <span>Maximum devices per user to prevent account sharing.</span>
          </div>

          <div className={styles.deviceSegmented}>
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                className={`${styles.deviceBtn} ${settings.max_devices_default === num ? styles.selected : ''}`}
                onClick={() => setSettings({ ...settings, max_devices_default: num })}
              >
                {num} {num === 1 ? 'device' : 'devices'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className={styles.systemActions}>
        <AnimatePresence>
          {success && (
            <motion.span 
              className={styles.savedBadge}
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              Saved
            </motion.span>
          )}
        </AnimatePresence>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={styles.saveBtn}
        >
          {isSaving ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14 }} />
              Saving...
            </>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

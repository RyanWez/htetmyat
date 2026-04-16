'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserRole, updateUserStatus, deleteUser, updateUserPassword, removeDevice, removeAllDevices, updateMaxDevices } from '../actions';

interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
  name_theme?: string;
  max_devices?: number | null;
}

interface Device {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string;
  last_used_at: string;
  created_at: string;
}

export default function UserDetailClient({ user, initialDevices }: { user: User; initialDevices: Device[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [now] = useState(() => Date.now());
  const [maxDevicesInput, setMaxDevicesInput] = useState<string>(
    user.max_devices !== null && user.max_devices !== undefined ? String(user.max_devices) : ''
  );
  const router = useRouter();

  const showSuccess = (msg: string) => {
    setError('');
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const showError = (msg: string) => {
    setSuccess('');
    setError(msg);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await updateUserRole(user.id, newRole);
      if (res.success) showSuccess('Access privileges updated successfully');
      else showError(res.error || 'Failed to update access privileges');
    });
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    setError(''); setSuccess('');
    setIsResetting(true);
    startTransition(async () => {
      const res = await updateUserPassword(user.id, newPassword);
      setIsResetting(false);
      if (res.success) {
        showSuccess('Password updated successfully');
        setNewPassword('');
      } else {
        showError(res.error || 'Failed to update password');
      }
    });
  };

  const handleStatusToggle = () => {
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await updateUserStatus(user.id, !user.is_active);
      if (res.success) showSuccess(user.is_active ? 'Account suspended successfully' : 'Account activated successfully');
      else showError(res.error || 'Failed to update account status');
    });
  };

  const handleDelete = () => {
    if (confirm('Are you absolutely sure you want to delete this user? This action cannot be undone.')) {
      setError(''); setSuccess('');
      startTransition(async () => {
        const res = await deleteUser(user.id);
        if (res.success) {
          router.push('/admin/users');
        } else {
          showError(res.error || 'Failed to delete user');
        }
      });
    }
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    if (!confirm(`"${deviceName}" ကို ဖြုတ်မှာ သေချာပါသလား?`)) return;
    startTransition(async () => {
      const res = await removeDevice(deviceId);
      if (res.success) {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
        showSuccess(`${deviceName} ကို ဖြုတ်လိုက်ပါပြီ`);
      } else {
        showError(res.error || 'Failed to remove device');
      }
    });
  };

  const handleRemoveAllDevices = () => {
    if (!confirm(`${user.display_name || user.email} ရဲ့ Device အားလုံးကို ဖြုတ်မှာ သေချာပါသလား? ပြန် Login ဝင်ဖို့ လိုပါလိမ့်မယ်။`)) return;
    startTransition(async () => {
      const res = await removeAllDevices(user.id);
      if (res.success) {
        setDevices([]);
        showSuccess('Device အားလုံး ဖြုတ်လိုက်ပါပြီ');
      } else {
        showError(res.error || 'Failed to remove all devices');
      }
    });
  };

  const handleMaxDevicesUpdate = () => {
    const value = maxDevicesInput.trim() === '' ? null : parseInt(maxDevicesInput, 10);
    if (value !== null && (isNaN(value) || value < 1 || value > 10)) {
      showError('Device limit must be between 1 and 10');
      return;
    }
    startTransition(async () => {
      const res = await updateMaxDevices(user.id, value);
      if (res.success) {
        showSuccess(value === null ? 'Using global default device limit' : `Device limit set to ${value}`);
      } else {
        showError(res.error || 'Failed to update device limit');
      }
    });
  };

  // Helper to get device icon
  const getDeviceIcon = (name: string) => {
    if (name.includes('iPhone') || name.includes('Android')) return '📱';
    if (name.includes('iPad')) return '📲';
    if (name.includes('macOS') || name.includes('Windows') || name.includes('Linux')) return '💻';
    return '🖥️';
  };

  // Helper for relative time (uses stable `now` from useState to avoid impure render)
  const getRelativeTime = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link 
          href="/admin/users" 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'var(--text-tertiary)', textDecoration: 'none', 
            fontWeight: 600, fontSize: '0.9rem',
            padding: '8px 16px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-full)', transition: 'all 0.2s'
          }}
          className="back-btn"
        >
          <span>←</span> Back to Directory
        </Link>
      </div>

      <AnimatePresence>
        {(error || success) && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            style={{ 
              padding: '16px 20px', 
              background: error ? 'var(--accent-danger-light)' : 'var(--accent-success-light)', 
              color: error ? 'var(--accent-danger)' : 'var(--accent-success)', 
              borderRadius: 'var(--radius-lg)', 
              marginBottom: 'var(--space-6)',
              boxShadow: error ? 'none' : 'var(--shadow-md)',
              display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600
            }}
          >
            <span style={{ fontSize: 20 }}>{error ? '⚠️' : '✨'}</span> 
            {error || success}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Banner Card */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-8)' }}>
          <div style={{ height: 120, background: 'var(--brand-gradient)', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -40, left: 32, width: 90, height: 90, borderRadius: '50%', background: 'var(--bg-surface-solid)', padding: 6, boxShadow: 'var(--shadow-md)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', fontSize: 36, fontWeight: 800 }}>
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
          <div className="banner-content">
            <div>
              <h1 className={`banner-content-title ${user.name_theme && user.name_theme !== 'none' ? 'name-theme-' + user.name_theme : ''}`.trim()} style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12, color: (user.name_theme && user.name_theme !== 'none') ? undefined : 'var(--text-primary)' }}>
                {user.display_name || 'System User'}
                <span style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', verticalAlign: 'middle',
                  background: user.role === 'admin' ? 'var(--brand-light)' : 'var(--bg-elevated)',
                  color: user.role === 'admin' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${user.role === 'admin' ? 'var(--brand-primary)' : 'var(--border-default)'}`
                }}>
                  {user.role}
                </span>
              </h1>
              <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '1rem' }}>{user.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: user.is_active ? 'var(--accent-success)' : 'var(--accent-danger)', boxShadow: `0 0 10px ${user.is_active ? 'var(--accent-success-light)' : 'var(--accent-danger-light)'}` }} />
              <span style={{ color: user.is_active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                {user.is_active ? 'Account Active' : 'Account Suspended'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {[
            { label: 'System ID', value: user.id.split('-')[0] + '••••', full: user.id, icon: '🆔' },
            { label: 'Member Since', value: new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), icon: '📅' },
            { label: 'Last Activity', value: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Never logged in', icon: '🕒' },
            { label: 'Active Devices', value: `${devices.length} device${devices.length !== 1 ? 's' : ''}`, icon: '📱' }
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (i * 0.05) }}
              key={stat.label} 
              className="glass-card" 
              style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}
            >
              <div style={{ fontSize: 28, background: 'var(--bg-elevated)', width: 48, height: 48, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', margin: '0 0 4px 0', fontWeight: 700 }}>{stat.label}</h3>
                <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.05rem' }} title={stat.full || stat.value}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ==========================================
            Device Management Section
            ========================================== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              📱 Device Management
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Max devices control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, margin: '0 6px' }}>LIMIT:</span>
                {['', '1', '2', '3'].map((val) => {
                  const isSelected = maxDevicesInput === val;
                  const label = val === '' ? 'System' : val;
                  return (
                    <button
                      key={label}
                      disabled={isPending}
                      onClick={() => {
                        setMaxDevicesInput(val);
                        // Auto-save logic can go here if preferred, but we will leave the Set button instead
                      }}
                      style={{
                        padding: '4px 10px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                        background: isSelected ? 'var(--brand-primary)' : 'transparent',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.8rem',
                        cursor: isPending ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(99, 102, 241, 0.4)' : 'none',
                        outline: 'none',
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected && !isPending) {
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected && !isPending) {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
                <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 4px' }} />
                <button
                  onClick={handleMaxDevicesUpdate}
                  disabled={isPending || maxDevicesInput === (user.max_devices?.toString() || '')}
                  style={{
                    padding: '4px 12px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'var(--bg-surface-solid)', color: '#fff', fontSize: '0.75rem',
                    fontWeight: 600, cursor: isPending || maxDevicesInput === (user.max_devices?.toString() || '') ? 'not-allowed' : 'pointer', opacity: isPending || maxDevicesInput === (user.max_devices?.toString() || '') ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!(isPending || maxDevicesInput === (user.max_devices?.toString() || ''))) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!(isPending || maxDevicesInput === (user.max_devices?.toString() || ''))) {
                      e.currentTarget.style.background = 'var(--bg-surface-solid)';
                    }
                  }}
                >
                  Save
                </button>
              </div>
              {devices.length > 0 && (
                <button
                  onClick={handleRemoveAllDevices}
                  disabled={isPending}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-md)', border: 'none',
                    background: 'var(--accent-danger-light)', color: 'var(--accent-danger)',
                    fontWeight: 600, fontSize: '0.8rem', cursor: isPending ? 'wait' : 'pointer',
                    opacity: isPending ? 0.7 : 1, transition: 'all 0.2s',
                    boxShadow: 'inset 0 0 0 1px currentColor',
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📱</div>
              <p style={{ color: 'var(--text-tertiary)', margin: 0, fontWeight: 500 }}>
                No devices registered. User needs to log in to register a device.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {devices.map((device, i) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card device-row"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                      border: '1px solid var(--border-default)',
                    }}>
                      {getDeviceIcon(device.device_name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {device.device_name}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🕒 {getRelativeTime(device.last_used_at)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📅 {new Date(device.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device.id, device.device_name)}
                    disabled={isPending}
                    title="Remove this device"
                    style={{
                      width: 34, height: 34, borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
                      color: 'var(--accent-danger)', cursor: isPending ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', transition: 'all 0.2s', flexShrink: 0,
                      opacity: isPending ? 0.5 : 1,
                    }}
                    className="device-remove-btn"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Settings Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Access & Security</h2>
          
          <div className="glass-card action-card">
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Role Permissions</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Elevate or restrict this user&apos;s administrative privileges.</p>
            </div>
            <select 
              value={user.role} 
              onChange={handleRoleChange}
              disabled={isPending}
              style={{ 
                padding: '12px 20px', borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', 
                color: 'var(--text-primary)', fontWeight: 600, outline: 'none',
                opacity: isPending ? 0.7 : 1, cursor: isPending ? 'wait' : 'pointer'
              }}
            >
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="glass-card action-card">
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Account Status</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Temporarily suspend access without deleting the account.</p>
            </div>
            <button 
              onClick={handleStatusToggle}
              disabled={isPending}
              style={{ 
                padding: '12px 24px', borderRadius: 'var(--radius-md)', border: 'none', 
                background: user.is_active ? 'var(--accent-danger-light)' : 'var(--accent-success-light)', 
                color: user.is_active ? 'var(--accent-danger)' : 'var(--accent-success)', 
                fontWeight: 700, cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1,
                transition: 'all 0.2s', boxShadow: 'inset 0 0 0 1px currentColor'
              }}
            >
              {user.is_active ? 'Suspend Account' : 'Reactivate Account'}
            </button>
          </div>

          <div className="glass-card action-card" style={{ marginTop: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 4px 0' }}>Reset Password</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>Set a new password for this user immediately without email verification.</p>
            </div>
            <form onSubmit={handlePasswordReset} className="action-form">
              <input 
                type="text" 
                placeholder="New Password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isPending || isResetting}
                style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface-solid)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
              />
              <button 
                type="submit"
                disabled={isPending || isResetting || !newPassword}
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--brand-gradient)', color: '#fff', fontWeight: 600, cursor: (isPending || isResetting || !newPassword) ? 'not-allowed' : 'pointer', opacity: (isPending || isResetting || !newPassword) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
              >
                {isResetting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="danger-zone" style={{ background: 'var(--accent-danger-light)', border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-xl)', padding: '32px' }}>
          <h3 style={{ color: 'var(--accent-danger)', fontWeight: 800, margin: '0 0 8px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> Danger Zone
          </h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 24px 0', maxWidth: 600 }}>
            Permanently delete this user and all of their associated data. This action cannot be undone and they will immediately lose access.
          </p>
          <button 
            onClick={handleDelete}
            disabled={isPending}
            style={{ 
              padding: '12px 24px', borderRadius: 'var(--radius-lg)', 
              background: 'var(--accent-danger)', color: '#fff', border: 'none',
              fontWeight: 700, cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.7 : 1,
              boxShadow: '0 4px 12px var(--shadow-sm)', transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Permanently Delete User
          </button>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .back-btn:hover { background: rgba(255,255,255,0.1) !important; color: var(--text-primary) !important; transform: translateX(-4px); }
        
        .banner-content { padding: 56px 32px 32px 32px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-8); }
        .action-card { padding: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
        .action-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        
        .device-row { transition: background 0.2s; }
        .device-row:hover { background: var(--bg-surface-hover); }
        .device-remove-btn:hover { background: var(--accent-danger-light) !important; border-color: var(--accent-danger) !important; }
        
        @media (max-width: 640px) {
          .banner-content { padding: 56px 20px 24px 20px; flex-direction: column; gap: 16px; }
          .banner-content-title { font-size: 1.5rem !important; flex-wrap: wrap; }
          .stats-grid { grid-template-columns: 1fr 1fr; margin-bottom: var(--space-6); }
          .action-card { flex-direction: column; align-items: stretch; text-align: left; padding: 20px; gap: 16px; }
          .action-form { flex-direction: column; align-items: stretch; }
          .action-card button, .action-card select, .action-form input { width: 100%; box-sizing: border-box; }
          .action-form button { margin-top: 8px; }
          .danger-zone { padding: 24px !important; }
          .danger-zone button { width: 100%; }
        }
      `}} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { fetchAllGiveaways, addGiveaway, updateGiveaway, deleteGiveaway } from './actions';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Giveaway, GiveawaySecret } from '@/lib/supabase/types';
import styles from './giveaways-admin.module.css';

type AugmentedGiveaway = Giveaway & Partial<GiveawaySecret>;

const LOGOS = [
  'expressvpn.png', 'outline.png', 'shadowrocket.png', 
  'tidal.png', 'toggle.png', 'v2box.png', 'v2ray.png','hiddify.png'
];

export default function AdminGiveaways() {
  const [giveaways, setGiveaways] = useState<AugmentedGiveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AugmentedGiveaway | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();

  const [form, setForm] = useState({
    title: '', description: '', type: 'VPN_KEY', is_active: true, 
    image_url: '/giveways/v2box.png', 
    credentials: '', email: '', password: '', 
    expiry: '', totalQuota: ''
  });

  useEffect(() => { loadGiveaways(); }, []);

  const loadGiveaways = async () => {
    const res = await fetchAllGiveaways();
    if (res.success) setGiveaways(res.data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ 
      title: '', description: '', type: 'VPN_KEY', is_active: true, 
      image_url: '/giveways/v2box.png', 
      credentials: '', email: '', password: '', 
      expiry: '', totalQuota: '' 
    });
    setShowModal(true);
  };

  const openEdit = (item: AugmentedGiveaway) => {
    setEditing(item);
    
    let email = '';
    let password = '';
    const credentials = item.credentials || '';
    
    if (item.type === 'ACCOUNT') {
      try {
        const parsed = JSON.parse(credentials);
        email = parsed.email || '';
        password = parsed.password || '';
      } catch {
        // Fallback if not stringified JSON
        email = credentials;
      }
    }
    
    const meta = item.metadata as Record<string, unknown> || {};
    
    setForm({
      title: item.title || '',
      description: item.description || '',
      type: item.type || 'VPN_KEY',
      is_active: item.is_active,
      image_url: item.image_url || '/giveways/v2box.png',
      credentials: item.type === 'VPN_KEY' ? credentials : '',
      email,
      password,
      expiry: (meta.Expiry as string) || (meta.expiry as string) || '',
      totalQuota: (meta['Total Quota'] as string) || (meta.totalQuota as string) || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata: Record<string, string> = {};
      if (form.expiry) metadata['Expiry'] = form.expiry;
      if (form.type === 'VPN_KEY' && form.totalQuota) {
        metadata['Total Quota'] = form.totalQuota;
      }

      let finalCredentials = '';
      if (form.type === 'VPN_KEY') {
        finalCredentials = form.credentials;
      } else if (form.type === 'ACCOUNT') {
        finalCredentials = JSON.stringify({ email: form.email, password: form.password });
      }

      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        is_active: form.is_active,
        image_url: form.image_url,
        qr_code_url: '', // explicitly removed
        credentials: finalCredentials,
        metadata
      };

      let result;
      if (editing) {
        result = await updateGiveaway(editing.id, payload);
      } else {
        result = await addGiveaway(payload);
      }
      
      if (!result?.success) throw new Error(result?.error || 'Failed to save');
      
      setShowModal(false);
      toast.success(editing ? 'Updated successfully' : 'Added successfully');
      loadGiveaways();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error('Failed to save', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Giveaway?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete', cancelText: 'Cancel', variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const result = await deleteGiveaway(id);
      if (!result?.success) throw new Error(result?.error);
      toast.success('Deleted successfully');
      loadGiveaways();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Giveaways Management</h1>
          <p className={styles.pageDesc}>Manage premium assets and keys.</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Giveaway</button>
        </div>
      </div>

      <div className={`glass-card ${styles.tableWrap}`} style={{ marginTop: '24px' }}>
        {loading ? <div style={{ padding: '24px' }}>Loading...</div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {giveaways.map(item => (
                <tr key={item.id} className={!item.is_active ? styles.rowInactive : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.image_url && <Image src={item.image_url} alt="" width={24} height={24} style={{ borderRadius: '4px', objectFit: 'contain' }} />}
                      {item.title}
                    </div>
                  </td>
                  <td>{item.type}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${item.is_active ? styles.statusActive : styles.statusInactive}`}>
                      {item.is_active ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'red' }} onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {giveaways.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>No giveaways found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1000, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Giveaway' : 'Add Giveaway'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">Title *</label>
                <input className="input-field" type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup}>
                  <label className="input-label">Type *</label>
                  <select className="select-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="VPN_KEY">VPN Key</option>
                    <option value="ACCOUNT">Account</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className="input-label">Target Logo *</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {form.image_url && <Image src={form.image_url} alt="preview" width={40} height={40} style={{ borderRadius: '8px', background: 'rgba(255,255,255,0.1)', objectFit: 'contain' }} />}
                    <select className="select-field" style={{ flex: 1 }} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})}>
                      {LOGOS.map(logo => (
                        <option key={logo} value={`/giveways/${logo}`}>{logo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">Description (Optional)</label>
                <textarea className="textarea-field" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ minHeight: '80px' }} />
              </div>

              {form.type === 'VPN_KEY' && (
                <>
                  <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className="input-label">Credentials / Connection String (Secured)</label>
                    <textarea className="textarea-field" style={{ fontFamily: 'monospace' }} value={form.credentials} onChange={e => setForm({...form, credentials: e.target.value})} placeholder="vless://..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className={styles.formGroup}>
                      <label className="input-label">Total Quota</label>
                      <input className="input-field" type="text" value={form.totalQuota} onChange={e => setForm({...form, totalQuota: e.target.value})} placeholder="e.g. 500.00GB" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="input-label">Expiry Date</label>
                      <input className="input-field" type="text" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} placeholder="e.g. 4/9/2026" />
                    </div>
                  </div>
                </>
              )}

              {form.type === 'ACCOUNT' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className={styles.formGroup}>
                      <label className="input-label">Email</label>
                      <input className="input-field" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email address" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="input-label">Password</label>
                      <input className="input-field" type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password" />
                    </div>
                  </div>
                  <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className="input-label">Expiry Date</label>
                    <input className="input-field" type="text" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} placeholder="e.g. 4/9/2026 or Lifetime" />
                  </div>
                </>
              )}

              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                  Active Status
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Giveaway'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchAllGiveaways, addGiveaway, updateGiveaway, deleteGiveaway } from './actions';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Giveaway, GiveawaySecret } from '@/lib/supabase/types';
import styles from './giveaways-admin.module.css';

type AugmentedGiveaway = Giveaway & Partial<GiveawaySecret>;

export default function AdminGiveaways() {
  const [giveaways, setGiveaways] = useState<AugmentedGiveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AugmentedGiveaway | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();

  const [form, setForm] = useState({
    title: '', description: '', type: 'VPN_KEY', is_active: true, image_url: '', qr_code_url: '', credentials: '', metadataStr: '{}'
  });

  useEffect(() => {
    loadGiveaways();
  }, []);

  const loadGiveaways = async () => {
    const res = await fetchAllGiveaways();
    if (res.success) setGiveaways(res.data || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', type: 'VPN_KEY', is_active: true, image_url: '', qr_code_url: '', credentials: '', metadataStr: '{\n  "Total Quota": "500.00GB",\n  "Remained": "408.32GB",\n  "Expiry": "4/9/2026"\n}' });
    setShowModal(true);
  };

  const openEdit = (item: AugmentedGiveaway) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      type: item.type || 'VPN_KEY',
      is_active: item.is_active,
      image_url: item.image_url || '',
      qr_code_url: item.qr_code_url || '',
      credentials: item.credentials || '',
      metadataStr: JSON.stringify(item.metadata || {}, null, 2)
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedMetadata = {};
      try {
        parsedMetadata = JSON.parse(form.metadataStr);
      } catch {
        throw new Error('Invalid JSON in Metadata field');
      }

      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        is_active: form.is_active,
        image_url: form.image_url,
        qr_code_url: form.qr_code_url,
        credentials: form.credentials,
        metadata: parsedMetadata
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
                  <td>{item.title}</td>
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
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">Type *</label>
                <select className="select-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="VPN_KEY">VPN Key</option>
                  <option value="ACCOUNT">Account</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">Description</label>
                <textarea className="textarea-field" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">Cover Image URL (optional)</label>
                <input className="input-field" type="text" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">QR Code URL (optional)</label>
                <input className="input-field" type="text" value={form.qr_code_url} onChange={e => setForm({...form, qr_code_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">Credentials / Connection String (Secured)</label>
                <textarea className="textarea-field" style={{ fontFamily: 'monospace' }} value={form.credentials} onChange={e => setForm({...form, credentials: e.target.value})} placeholder="vless://..." />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">Metadata (JSON)</label>
                <textarea className="textarea-field" style={{ fontFamily: 'monospace', minHeight: '120px' }} value={form.metadataStr} onChange={e => setForm({...form, metadataStr: e.target.value})} />
              </div>
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label className="input-label">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} style={{ marginRight: '8px' }} />
                  Active Status
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

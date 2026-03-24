'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AppleId } from '@/lib/supabase/types';
import { getCountryFlag } from '@/lib/utils';
import styles from './manage-ids.module.css';

export default function AdminAppleIds() {
  const [appleIds, setAppleIds] = useState<AppleId[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AppleId | null>(null);
  const [form, setForm] = useState({
    email: '', password: '', country: 'US', is_active: true, notes: '',
  });

  useEffect(() => { fetchAppleIds(); }, []);

  const fetchAppleIds = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('apple_ids').select('*').order('created_at', { ascending: false });
      setAppleIds(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ email: '', password: '', country: 'US', is_active: true, notes: '' });
    setShowModal(true);
  };

  const openEdit = (item: AppleId) => {
    setEditing(item);
    setForm({
      email: item.email,
      password: item.password,
      country: item.country,
      is_active: item.is_active,
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const supabase = createClient();
      if (editing) {
        await supabase.from('apple_ids').update(form).eq('id', editing.id);
      } else {
        await supabase.from('apple_ids').insert(form);
      }
      setShowModal(false);
      fetchAppleIds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Apple ID?')) return;
    try {
      const supabase = createClient();
      await supabase.from('apple_ids').delete().eq('id', id);
      fetchAppleIds();
    } catch (err) {
      console.error(err);
    }
  };

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'JP', name: 'Japan' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AU', name: 'Australia' },
    { code: 'CA', name: 'Canada' },
    { code: 'TH', name: 'Thailand' },
    { code: 'MM', name: 'Myanmar' },
  ];

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Apple ID Management</h1>
            <p className={styles.pageDesc}>{appleIds.length} total Apple IDs</p>
          </div>
          <div className={styles.headerActions}>
            <button className="btn btn-primary" onClick={openAdd}>
              + Add New ID
            </button>
            <button className="btn btn-secondary" onClick={fetchAppleIds}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className={`glass-card ${styles.tableWrap}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {loading ? (
          <div style={{ padding: 'var(--space-8)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonRow}`} />
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Country</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appleIds.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                      {item.email}
                    </span>
                  </td>
                  <td>{getCountryFlag(item.country)} {item.country}</td>
                  <td>
                    <span className={`badge ${item.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {item.is_active ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.notes || '—'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                        ✏️
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {appleIds.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    No Apple IDs found. Click &quot;Add New ID&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="modal-header">
              <h2>{editing ? 'Edit Apple ID' : 'Add New Apple ID'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className={styles.formGroup}>
                <label className="input-label">Email *</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="appleid@icloud.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className="input-label">Password *</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className="input-label">Country</label>
                <select
                  className="select-field"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {getCountryFlag(c.code)} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className="input-label">Notes (optional)</label>
                <textarea
                  className="textarea-field"
                  placeholder="e.g. Don't change password"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className="input-label">Status</label>
                <div className={styles.statusToggle}>
                  <button
                    className={`${styles.toggleBtn} ${form.is_active ? styles.toggleActive : ''}`}
                    onClick={() => setForm({ ...form, is_active: true })}
                    type="button"
                  >
                    🟢 Active
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${!form.is_active ? styles.toggleInactive : ''}`}
                    onClick={() => setForm({ ...form, is_active: false })}
                    type="button"
                  >
                    ⚪ Inactive
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editing ? 'Save Changes' : 'Add Apple ID'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

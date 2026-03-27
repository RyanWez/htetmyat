'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AppleId } from '@/lib/supabase/types';
import { getCountryFlag } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { fetchAllAppleIds, uploadAppleIdImage } from './actions';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import styles from './manage-ids.module.css';

export default function AdminAppleIds() {
  const [appleIds, setAppleIds] = useState<AppleId[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AppleId | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { confirm } = useConfirm();
  const [form, setForm] = useState({
    title: '', description: '', email: '', password: '', country: 'US', is_active: true, notes: '', images: [] as string[]
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchAppleIds();

    const supabase = createClient();
    const channel = supabase
      .channel('admin:apple_ids')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apple_ids' },
        () => {
          fetchAppleIds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAppleIds = async () => {
    try {
      const result = await fetchAllAppleIds();
      if (result.success) {
        setAppleIds(result.data as AppleId[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', email: '', password: '', country: 'US', is_active: true, notes: '', images: [] });
    setShowModal(true);
  };

  const openEdit = (item: AppleId) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      email: item.email,
      password: item.password,
      country: item.country,
      is_active: item.is_active,
      notes: item.notes || '',
      images: item.images || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      if (editing) {
        const { updateAppleId } = await import('./actions');
        result = await updateAppleId(editing.id, form);
      } else {
        const { addAppleId } = await import('./actions');
        result = await addAppleId(form);
      }
      
      if (!result?.success) throw new Error(result?.error || 'Failed to save');
      
      setShowModal(false);
      toast.success(editing ? 'Apple ID updated successfully' : 'Apple ID added successfully');
      fetchAppleIds();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save Apple ID', 'Please check your input and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Apple ID?',
      message: 'This action cannot be undone. The Apple ID will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const { deleteAppleId } = await import('./actions');
      const result = await deleteAppleId(id);
      
      if (!result?.success) throw new Error(result?.error || 'Failed to delete');
      
      toast.success('Apple ID deleted successfully');
      fetchAppleIds();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete Apple ID');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingImages(true);
    const files = Array.from(e.target.files);
    const newImages = [...form.images];
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const result = await uploadAppleIdImage(formData);
        
        if (!result.success) throw new Error(result.error);
        if (result.url) newImages.push(result.url);
      }
      setForm({ ...form, images: newImages });
      toast.success('Images uploaded successfully');
    } catch (err) {
      const error = err as Error;
      console.error(error);
      toast.error('Failed to upload images', error.message);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleStatus = async (item: AppleId) => {
    setTogglingId(item.id);
    try {
      const { updateAppleId } = await import('./actions');
      const result = await updateAppleId(item.id, { is_active: !item.is_active });
      if (!result?.success) throw new Error(result?.error || 'Failed to toggle status');
      toast.success(`Apple ID ${item.is_active ? 'deactivated' : 'activated'}`);
      fetchAppleIds();
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = appleIds.filter((a) => a.is_active).length;
  const inactiveCount = appleIds.filter((a) => !a.is_active).length;
  const filteredAppleIds = statusFilter === 'all'
    ? appleIds
    : statusFilter === 'active'
      ? appleIds.filter((a) => a.is_active)
      : appleIds.filter((a) => !a.is_active);

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
            <p className={styles.pageDesc}>{appleIds.length} total · {activeCount} active · {inactiveCount} inactive</p>
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

      {/* Status Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${statusFilter === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All <span className={styles.filterCount}>{appleIds.length}</span>
        </button>
        <button
          className={`${styles.filterTab} ${statusFilter === 'active' ? styles.filterTabActive : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <span className={styles.statusDotGreen} /> Active <span className={styles.filterCount}>{activeCount}</span>
        </button>
        <button
          className={`${styles.filterTab} ${statusFilter === 'inactive' ? styles.filterTabActive : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          <span className={styles.statusDotGray} /> Inactive <span className={styles.filterCount}>{inactiveCount}</span>
        </button>
      </div>

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
              {filteredAppleIds.map((item) => (
                <tr key={item.id} className={!item.is_active ? styles.rowInactive : ''}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                      {item.email}
                    </span>
                  </td>
                  <td>{getCountryFlag(item.country)} {item.country}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${item.is_active ? styles.statusActive : styles.statusInactive}`}>
                      <span className={styles.statusIndicator} />
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.notes || '—'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.switchTrack} ${item.is_active ? styles.switchOn : ''} ${togglingId === item.id ? styles.switchLoading : ''}`}
                        title={item.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        type="button"
                        aria-label={item.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                      <button className={`btn btn-ghost btn-sm ${styles.actionBtn}`} onClick={() => openEdit(item)} title="Edit">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className={`btn btn-ghost btn-sm ${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(item.id)} title="Delete">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAppleIds.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    {statusFilter === 'inactive'
                      ? 'No inactive Apple IDs.'
                      : statusFilter === 'active'
                        ? 'No active Apple IDs.'
                        : 'No Apple IDs found. Click "Add New ID" to create one.'}
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
                <label className="input-label">Title *</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="e.g. Action Games ID - GTA & Minecraft"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className="input-label">Games/Description *</label>
                <textarea
                  className="textarea-field"
                  placeholder="List games available..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className="input-label">Images (Max 3+)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploadingImages}
                  className="input-field"
                  style={{ padding: '0.4rem', background: 'transparent' }}
                />
                {uploadingImages && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>Uploading...</div>}
                {form.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {form.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                        <Image src={img} alt={`Preview ${i}`} fill style={{ objectFit: 'cover', borderRadius: '8px' }} />
                        <button 
                          className="btn-icon" 
                          style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={(e) => { e.preventDefault(); removeImage(i); }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <div className={styles.modalStatusControl}>
                  <button
                    className={`${styles.modalSwitchTrack} ${form.is_active ? styles.switchOn : ''}`}
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    type="button"
                  >
                    <span className={styles.switchThumb} />
                  </button>
                  <span className={`${styles.modalStatusLabel} ${form.is_active ? styles.modalStatusLabelActive : styles.modalStatusLabelInactive}`}>
                    <span className={styles.statusIndicator} />
                    {form.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><span className="spinner" /> {editing ? 'Saving...' : 'Adding...'}</>
                ) : (
                  editing ? 'Save Changes' : 'Add Apple ID'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

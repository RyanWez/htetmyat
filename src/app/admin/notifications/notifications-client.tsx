'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { updateTemplate, sendManualNotification } from './actions';
import { NotificationTemplate } from '@/lib/supabase/types';
import styles from './notifications.module.css';

interface Props {
  initialTemplates: NotificationTemplate[];
}

export default function NotificationsClient({ initialTemplates }: Props) {
  const [activeTab, setActiveTab] = useState<'send' | 'templates'>('send');
  const toast = useToast();

  // Send Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState<'global' | 'personal'>('global');
  const [userId, setUserId] = useState('');
  const [sendPush, setSendPush] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Template Form State
  const activeAppleIdTemplate = initialTemplates.find(t => t.name === 'apple_id_active');
  const [tplTitle, setTplTitle] = useState(activeAppleIdTemplate?.title_template || '');
  const [tplMessage, setTplMessage] = useState(activeAppleIdTemplate?.message_template || '');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return toast.error('Required Fields', 'Title and Message are required.');
    
    setIsSending(true);
    try {
      const result = await sendManualNotification({
        title, message, link, type, userId: type === 'personal' ? userId : undefined, sendPush
      });
      if (result.success) {
        toast.success('Sent!', 'Notification sent successfully.');
        setTitle('');
        setMessage('');
        setLink('');
      } else {
        toast.error('Failed', result.error || 'Failed to send');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle || !tplMessage) return toast.error('Required Fields', 'Template fields cannot be empty.');
    
    setIsSavingTemplate(true);
    try {
      const result = await updateTemplate('apple_id_active', tplTitle, tplMessage);
      if (result.success) {
        toast.success('Saved!', 'Template updated successfully.');
      } else {
        toast.error('Failed', result.error || 'Failed to save template');
      }
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'send' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('send')}
        >
          Send Notification
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'templates' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Auto Templates
        </button>
      </div>

      {activeTab === 'send' && (
        <form onSubmit={handleSend} className={styles.card}>
          <h2 className={styles.cardTitle}>Manually Send Notification</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Type</label>
            <select 
              className={styles.select} 
              value={type} 
              onChange={e => setType(e.target.value as 'global' | 'personal')}
            >
              <option value="global">Global (All Users)</option>
              <option value="personal">Personal (Specific User)</option>
            </select>
          </div>

          {type === 'personal' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>User ID</label>
              <input 
                type="text" 
                className={styles.input} 
                required 
                value={userId} 
                onChange={e => setUserId(e.target.value)} 
                placeholder="UUID of the user"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Title</label>
            <input 
              type="text" 
              className={styles.input} 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. System Maintenance"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Message</label>
            <textarea 
              className={styles.textarea} 
              required 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Detailed notification message..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Link (Optional)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={link} 
              onChange={e => setLink(e.target.value)} 
              placeholder="e.g. /apple-ids"
            />
          </div>

          <div className={styles.checkboxWrapper} onClick={() => setSendPush(!sendPush)}>
            <input 
              type="checkbox" 
              id="sendPush" 
              className={styles.checkbox}
              checked={sendPush} 
              onChange={e => setSendPush(e.target.checked)} 
              onClick={e => e.stopPropagation()}
            />
            <label htmlFor="sendPush" style={{ cursor: 'pointer', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
              Also send Web Push to offline users
            </label>
          </div>

          <button type="submit" className={styles.button} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      )}

      {activeTab === 'templates' && (
        <form onSubmit={handleSaveTemplate} className={styles.card}>
          <h2 className={styles.cardTitle}>&quot;Active Apple ID&quot; Auto Template</h2>
          <p className={styles.helpText}>
            This template is automatically sent when you mark an Apple ID as Active. 
            Use <code className={styles.codeBadge}>{`{{title}}`}</code> to insert the Apple ID email/title dynamically.
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Title Template</label>
            <input 
              type="text" 
              className={styles.input} 
              required 
              value={tplTitle} 
              onChange={e => setTplTitle(e.target.value)} 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Message Template</label>
            <textarea 
              className={styles.textarea} 
              required 
              value={tplMessage} 
              onChange={e => setTplMessage(e.target.value)} 
            />
          </div>

          <button type="submit" className={styles.button} disabled={isSavingTemplate}>
            {isSavingTemplate ? 'Saving...' : 'Save Template'}
          </button>
        </form>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { getMyNotifications, markNotificationAsRead, NotificationWithRead } from './notification-actions';
import styles from './NotificationCenter.module.css';

// Client-side relative time formatter
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
}

export default function NotificationCenter() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationWithRead[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const fetchNotis = async () => {
    if (status !== 'authenticated') return;
    const { success, data } = await getMyNotifications();
    if (success && data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotis();
  }, [status]);

  useEffect(() => {
    // Only subscribe to realtime if authenticated
    if (status !== 'authenticated') return;
    
    const supabase = createClient();
    const userId = session?.user?.id;
    
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNoti = payload.new;
        // Global or explicitly for this user
        if (newNoti.type === 'global' || newNoti.user_id === userId) {
          // Trigger ding/toast
          toast.info('New Notification', newNoti.title);
          // Refetch to get updated list and accurate states
          fetchNotis();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status, session]);

  // Handle outside click closure
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRead = async (noti: NotificationWithRead) => {
    if (!noti.is_read) {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
      await markNotificationAsRead(noti.id);
    }
    setIsOpen(false);
  };

  if (status !== 'authenticated') return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.bellBtn} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && <span className={styles.badge} />}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.title}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 500 }}>
                {unreadCount} New
              </span>
            )}
          </div>
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>You have no notifications right now.</div>
            ) : (
              notifications.map((noti) => (
                <Link
                  key={noti.id}
                  href={noti.link || '#'}
                  className={`${styles.item} ${!noti.is_read ? styles.itemUnread : ''}`}
                  onClick={(e) => {
                    if (!noti.link) e.preventDefault();
                    handleRead(noti);
                  }}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTitle}>{noti.title}</span>
                    {!noti.is_read && <div className={styles.unreadDot} />}
                  </div>
                  <span className={styles.itemMessage}>{noti.message}</span>
                  <span className={styles.itemTime}>{formatTimeAgo(noti.created_at)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

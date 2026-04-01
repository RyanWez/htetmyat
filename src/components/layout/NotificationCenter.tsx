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

  const fetchNotis = async (showToastForNew = false) => {
    if (status !== 'authenticated') return;
    const { success, data } = await getMyNotifications();
    if (success && data) {
      setNotifications(prev => {
        // Find if there are new unread notifications that weren't in previous state
        if (showToastForNew && prev.length > 0) {
          const prevIds = new Set(prev.map(p => p.id));
          const newNotis = data.filter(n => !prevIds.has(n.id) && !n.is_read);
          
          if (newNotis.length > 0) {
            // Defer side-effect to avoid 'Cannot update a component while rendering' error
            setTimeout(() => {
              newNotis.forEach(n => toast.info(n.title, n.message));
            }, 0);
          }
        }
        return data;
      });
    }
  };

  useEffect(() => {
    fetchNotis();
    
    // Fallback Polling (every 15s) to guarantee updates if WebSocket gets blocked
    const interval = setInterval(() => fetchNotis(true), 15000);
    
    // Window focus fetch (feels real-time when returning to tab)
    const onFocus = () => fetchNotis(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [status]);

  useEffect(() => {
    // Only subscribe to realtime if authenticated
    if (status !== 'authenticated') return;
    
    const supabase = createClient();
    const userId = session?.user?.id;
    
    // Create a stable channel name
    const channel = supabase.channel('global_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNoti = payload.new;
        if (newNoti.type === 'global' || newNoti.user_id === userId) {
           fetchNotis(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status, session?.user?.id]);

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
              <span style={{ fontSize: '13px', color: 'var(--accent-danger)', fontWeight: 600 }}>
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

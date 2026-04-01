'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { getMyNotifications, markNotificationAsRead, markAllAsRead, NotificationWithRead } from './notification-actions';
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
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const toastedIds = useRef<Set<string>>(new Set());
  const notificationsRef = useRef<NotificationWithRead[]>([]);

  // Update ref whenever state changes
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const fetchNotis = useCallback(async (showToastForNew = false) => {
    if (status !== 'authenticated') return;
    
    const { success, data, hasMore: more } = await getMyNotifications(10, 0);
    if (success && data) {
      setHasMore(!!more);
      
      // Calculate new notifications BEFORE calling setNotifications
      // This is safe even if current notifications state hasn't updated yet IF
      // we check against data. 
      // Actually, comparing against state 'notifications' here is safer 
      // if we're worried about concurrent fetches, but we should use the ref
      // to guarantee we don't toast the same ID twice.

      if (showToastForNew) {
        // Use ref for comparison to keep the callback stable (no dependency on notifications state)
        const currentIds = new Set(notificationsRef.current.map(n => n.id));
        const newNotis = data.filter(n => !n.is_read && !currentIds.has(n.id) && !toastedIds.current.has(n.id));
        
        newNotis.forEach(n => {
          toastedIds.current.add(n.id);
          toast.info(n.title, n.message);
        });
      }
      
      setNotifications(data);
    }
  }, [status, toast]); // notifications removed from deps

  const loadMore = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const { success, data, hasMore: more } = await getMyNotifications(10, notifications.length);
    if (success && data) {
      setHasMore(!!more);
      setNotifications(prev => {
        // Append unique notifications
        const currentIds = new Set(prev.map(p => p.id));
        const newUnique = data.filter(d => !currentIds.has(d.id));
        return [...prev, ...newUnique];
      });
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    let isMounted = true;
    
    const initFetch = async () => {
      if (isMounted) {
        await fetchNotis();
      }
    };
    
    initFetch();
    
    // Fallback Polling (every 15s) to guarantee updates if WebSocket gets blocked
    const interval = setInterval(() => {
      if (isMounted) fetchNotis(true);
    }, 15000);
    
    // Window focus fetch (feels real-time when returning to tab)
    const onFocus = () => {
      if (isMounted) fetchNotis(true);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotis]);

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
  }, [status, session?.user?.id, fetchNotis]);

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

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    const { success } = await markAllAsRead(unreadIds);
    if (success) {
      toast.success('Success', 'All notifications marked as read');
    }
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
            <div className={styles.headerTitleArea}>
              <span className={styles.title}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '13px', color: 'var(--accent-danger)', fontWeight: 600 }}>
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                className={styles.markAllReadBtn}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
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
            {hasMore && (
              <button 
                className={styles.loadMoreBtn} 
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load More Options'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

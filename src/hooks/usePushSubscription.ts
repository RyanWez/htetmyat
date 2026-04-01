'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const { data: session } = useSession();
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // Check if Service Worker and Push are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!session?.user) {
      toast.error('Login Required', 'Please login to enable notifications.');
      return false;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const response = await Notification.requestPermission();
      
      if (response !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to backend
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error('Failed to save subscription');

      setIsSubscribed(true);
      toast.success('Subscribed!', 'You will now receive Apple ID updates.');
      return true;
    } catch (err) {
      console.error('Failed to subscribe:', err);
      const message = err instanceof Error ? err.message : 'Could not enable notifications.';
      toast.error('Subscription Failed', message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSubscribed,
    isSupported,
    loading,
    subscribeToPush
  };
}

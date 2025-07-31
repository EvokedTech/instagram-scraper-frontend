'use client';

import React, { useState, useCallback, useEffect } from 'react';
import NotificationToast, { Notification } from './NotificationToast';
import { useWebSocket } from '@/hooks/useWebSocket';

// Create a singleton instance for managing notifications globally
class NotificationManager {
  private listeners: Array<(notification: Notification) => void> = [];

  subscribe(listener: (notification: Notification) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(notification: Omit<Notification, 'id'>) {
    const fullNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      duration: notification.duration ?? 5000,
    };
    this.listeners.forEach(listener => listener(fullNotification));
  }

  success(title: string, message?: string) {
    this.notify({ type: 'success', title, message });
  }

  error(title: string, message?: string) {
    this.notify({ type: 'error', title, message });
  }

  warning(title: string, message?: string) {
    this.notify({ type: 'warning', title, message });
  }

  info(title: string, message?: string) {
    this.notify({ type: 'info', title, message });
  }
}

export const notificationManager = new NotificationManager();

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    return unsubscribe;
  }, []);

  // Listen for WebSocket events and show notifications
  useEffect(() => {
    if (!isConnected) return;

    // Connection status notifications
    const unsubscribeConnection = subscribe('connection:status', ({ connected, reason }: any) => {
      if (connected) {
        notificationManager.success('Connected', 'Real-time updates enabled');
      } else if (reason) {
        notificationManager.error('Disconnected', reason);
      }
    });

    // System error notifications
    const unsubscribeError = subscribe('system:error', ({ error, sessionId }: any) => {
      notificationManager.error(
        'System Error',
        error || 'An unexpected error occurred'
      );
    });

    // Profile scraping notifications
    const unsubscribeProfileFailed = subscribe('profile:failed', ({ username, error }: any) => {
      notificationManager.warning(
        'Profile Scraping Failed',
        `Failed to scrape @${username}: ${error || 'Unknown error'}`
      );
    });

    // Session status notifications
    const unsubscribeSessionStatus = subscribe('session:statusChanged', ({ sessionId, status, sessionName }: any) => {
      const messages: Record<string, { title: string; type: 'success' | 'info' | 'error' }> = {
        'completed': { title: 'Session Completed', type: 'success' },
        'failed': { title: 'Session Failed', type: 'error' },
        'stopped': { title: 'Session Stopped', type: 'info' },
        'paused': { title: 'Session Paused', type: 'info' },
        'running': { title: 'Session Resumed', type: 'success' },
      };

      const message = messages[status];
      if (message) {
        notificationManager[message.type](
          message.title,
          sessionName ? `Session "${sessionName}"` : undefined
        );
      }
    });

    return () => {
      unsubscribeConnection();
      unsubscribeError();
      unsubscribeProfileFailed();
      unsubscribeSessionStatus();
    };
  }, [isConnected, subscribe]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <div className="fixed bottom-0 right-0 z-50 p-6 space-y-4 pointer-events-none">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
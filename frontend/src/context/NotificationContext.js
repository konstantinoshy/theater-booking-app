import React, { createContext, useContext, useState, useCallback } from 'react';
import { scheduleLocalNotification } from '../utils/notifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Add a notification to the in-app history AND trigger a local push
   * (if notifications are enabled in AuthContext).
   *
   * @param {string} title  – e.g. 'Επιτυχής κράτηση!'
   * @param {string} body   – e.g. 'Η θέση σας για … επιβεβαιώθηκε.'
   * @param {'booking'|'cancel'|'info'} type
   */
  const addNotification = useCallback((title, body, type = 'info') => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      body,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [entry, ...prev]);

    // Fire the device-level local notification (safe — won't crash in Expo Go)
    scheduleLocalNotification(title, body).catch(() => {});
  }, []);

  /** Mark a single notification as read */
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  /** Mark all as read */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  /** Count of unread notifications */
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

/**
 * Notification helpers — in-app only.
 * expo-notifications (push) requires a development build and is NOT
 * available in Expo Go, so we skip it entirely here.
 * The in-app notification history in NotificationContext still works fine.
 */

export function configureNotifications() {
  // No-op in Expo Go — push notifications need a dev build.
}

export async function scheduleLocalNotification(_title, _body) {
  // No-op in Expo Go — in-app toasts are handled by NotificationContext.
}

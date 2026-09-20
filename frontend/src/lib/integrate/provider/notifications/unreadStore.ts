const listeners = new Set<() => void>();
let unreadCount = 0;

export function getUnreadNotificationsCount() {
  return unreadCount;
}

export function getUnreadNotificationsServerSnapshot() {
  return 0;
}

export function setUnreadNotificationsCount(count: number) {
  const next = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  if (next === unreadCount) return;
  unreadCount = next;
  listeners.forEach((listener) => listener());
}

export function subscribeUnreadNotifications(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

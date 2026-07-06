import { create } from "zustand";

export type NotificationKind = "success" | "error" | "warning" | "info";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  message: string;
  title?: string;
  createdAt: number;
  read: boolean;
}

type NotificationState = {
  items: AppNotification[];
  unreadCount: number;
  push: (item: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markAllRead: () => void;
  clear: () => void;
};

const MAX_ITEMS = 50;

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  push: (item) =>
    set((state) => {
      const text = item.message.trim();
      if (!text) return state;

      const recent = state.items[0];
      const now = Date.now();
      if (
        recent &&
        recent.message === text &&
        recent.kind === item.kind &&
        now - recent.createdAt < 800
      ) {
        return state;
      }

      const entry: AppNotification = {
        ...item,
        message: text,
        id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: now,
        read: false,
      };
      const items = [entry, ...state.items].slice(0, MAX_ITEMS);
      return { items, unreadCount: items.filter((n) => !n.read).length };
    }),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clear: () => set({ items: [], unreadCount: 0 }),
}));

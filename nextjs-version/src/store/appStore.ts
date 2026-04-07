import { create } from "zustand";
import type { Notification } from "@/types/database";

interface AppState {
  // Notification panel
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (n: Notification[]) => void;
  markAllRead: () => void;
  markOneRead: (id: number) => void;

  // Global loading state for async mock fetches
  globalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;

  // Sidebar open state (mobile)
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
  markOneRead: (id) =>
    set((s) => {
      const updated = s.notifications.map((n) =>
        n.notification_id === id ? { ...n, is_read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.is_read).length,
      };
    }),

  globalLoading: false,
  setGlobalLoading: (v) => set({ globalLoading: v }),

  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));

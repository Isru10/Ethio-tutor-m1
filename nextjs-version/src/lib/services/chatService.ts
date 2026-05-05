import { useAuthStore } from "../store/useAuthStore";
import { API_BASE } from "../api";

function authHeaders() {
  const token = useAuthStore.getState().accessToken;
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
}

export interface ApiConversation {
  conversation_id: number;
  type: string;
  name: string | null;
  participants: { user_id: number; name: string; role: string }[];
  last_message: { content: string; sender_id: number; created_at: string } | null;
  last_read_at: string;
  created_at: string;
}

export interface ApiMessage {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  type: string;
  created_at: string;
  sender: { user_id: number; name: string; role: string };
}

export interface ApiUser {
  user_id: number;
  name: string;
  role: string;
  email: string;
}

export const chatService = {
  async getConversations(): Promise<ApiConversation[]> {
    const res = await fetch(`${API_BASE}/chat/conversations`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  async startConversation(targetUserId: number): Promise<ApiConversation> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  async getMessages(conversationId: number, cursor?: number): Promise<ApiMessage[]> {
    const url = `${API_BASE}/chat/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ""}`;
    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  async sendMessage(conversationId: number, content: string, type = "text"): Promise<ApiMessage> {
    const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content, type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  async markRead(conversationId: number): Promise<void> {
    await fetch(`${API_BASE}/chat/conversations/${conversationId}/read`, {
      method: "PATCH",
      headers: authHeaders(),
    });
  },

  async getChatableUsers(): Promise<ApiUser[]> {
    const res = await fetch(`${API_BASE}/chat/users`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  async getUnreadCounts(): Promise<Record<number, number>> {
    const res = await fetch(`${API_BASE}/chat/unread`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },

  async broadcast(targetUserIds: number[], content: string): Promise<{ sent: number }> {
    const res = await fetch(`${API_BASE}/chat/broadcast`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ targetUserIds, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.data;
  },
};

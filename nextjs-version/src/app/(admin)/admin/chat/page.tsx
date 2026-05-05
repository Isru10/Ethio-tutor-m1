"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { chatService, type ApiConversation, type ApiMessage, type ApiUser } from "@/lib/services/chatService"
import { Chat } from "./components/chat"
import { useChat, type Conversation, type Message, type User } from "./use-chat"

const POLL_INTERVAL = 4000

function mapUser(u: ApiUser): User {
  return { id: String(u.user_id), name: u.name, email: u.email, avatar: "", status: "online", lastSeen: new Date().toISOString(), role: u.role, department: u.role }
}

function mapMessage(m: ApiMessage): Message {
  return { id: String(m.message_id), content: m.content, timestamp: m.created_at, senderId: String(m.sender_id), type: (m.type as "text" | "image" | "file") ?? "text", isEdited: false, reactions: [], replyTo: null }
}

function mapConversation(c: ApiConversation, currentUserId: number, unreadCounts: Record<number, number>): Conversation {
  const other = c.participants.find(p => p.user_id !== currentUserId)
  return {
    id: String(c.conversation_id), type: c.type as "direct" | "group",
    participants: c.participants.map(p => String(p.user_id)),
    name: c.name ?? other?.name ?? "Chat", avatar: "",
    lastMessage: c.last_message
      ? { id: "last", content: c.last_message.content, timestamp: c.last_message.created_at, senderId: String(c.last_message.sender_id) }
      : { id: "", content: "", timestamp: c.created_at, senderId: "" },
    unreadCount: unreadCounts[c.conversation_id] ?? 0, isPinned: false, isMuted: false,
  }
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load conversations + users directly into the Zustand store
  const loadConversations = useCallback(async () => {
    if (!user) return
    try {
      const [convs, counts, chatUsers] = await Promise.all([
        chatService.getConversations(),
        chatService.getUnreadCounts(),
        chatService.getChatableUsers(),
      ])
      useChat.setState({
        conversations: convs.map(c => mapConversation(c, user.user_id, counts)),
        users: chatUsers.map(mapUser),
      })
    } catch { /* silent */ }
  }, [user])

  // Load messages for the selected conversation directly into the store
  const loadMessages = useCallback(async (convId: string) => {
    if (!user) return
    try {
      const msgs = await chatService.getMessages(Number(convId))
      useChat.setState(state => ({
        messages: { ...state.messages, [convId]: msgs.map(mapMessage) }
      }))
      chatService.markRead(Number(convId)).catch(() => {})
    } catch { /* silent */ }
  }, [user])

  // Wire up addMessage to call the real API (optimistic update)
  useEffect(() => {
    if (!user) return
    useChat.setState({
      addMessage: (conversationId: string, localMsg: Message) => {
        // Optimistic: add immediately
        useChat.setState(state => ({
          messages: { ...state.messages, [conversationId]: [...(state.messages[conversationId] || []), localMsg] },
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, lastMessage: { id: localMsg.id, content: localMsg.content, timestamp: localMsg.timestamp, senderId: localMsg.senderId } }
              : conv
          ),
        }))
        // Persist to API, replace optimistic with real message
        chatService.sendMessage(Number(conversationId), localMsg.content)
          .then(realMsg => {
            useChat.setState(state => ({
              messages: {
                ...state.messages,
                [conversationId]: (state.messages[conversationId] || []).map(m =>
                  m.id === localMsg.id ? mapMessage(realMsg) : m
                ),
              },
            }))
          })
          .catch(() => {
            // Remove optimistic message on failure
            useChat.setState(state => ({
              messages: {
                ...state.messages,
                [conversationId]: (state.messages[conversationId] || []).filter(m => m.id !== localMsg.id),
              },
            }))
          })
      },
    })
  }, [user])

  // Poll conversations
  useEffect(() => {
    loadConversations()
    pollRef.current = setInterval(loadConversations, POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [loadConversations])

  // Poll messages for selected conversation
  const selectedConversation = useChat(s => s.selectedConversation)
  useEffect(() => {
    if (!selectedConversation) return
    loadMessages(selectedConversation)
    msgPollRef.current = setInterval(() => loadMessages(selectedConversation), 3000)
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current) }
  }, [selectedConversation, loadMessages])

  return (
    <div className="px-4 md:px-6">
      <Chat
        currentUserId={user ? String(user.user_id) : ""}
        onStartConversation={async (targetUserId) => {
          try {
            const conv = await chatService.startConversation(targetUserId)
            await loadConversations()
            useChat.getState().setSelectedConversation(String(conv.conversation_id))
          } catch { /* silent */ }
        }}
        onBroadcast={async (targetUserIds, content) => {
          await chatService.broadcast(targetUserIds, content)
          await loadConversations()
        }}
      />
    </div>
  )
}

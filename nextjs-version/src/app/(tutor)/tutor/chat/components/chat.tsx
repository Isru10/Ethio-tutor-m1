"use client"

import { useEffect, useRef, useState } from "react"
import { Menu, X, MessageSquarePlus, Search } from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConversationList } from "./conversation-list"
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { useChat } from "../use-chat"

interface ChatProps {
  currentUserId: string
  onStartConversation?: (targetUserId: number) => Promise<void>
  onBroadcast?: (targetUserIds: number[], content: string) => Promise<void>
}

/**
 * Chat reads ALL data directly from the Zustand store (useChat).
 * The page (chat/page.tsx) is responsible for loading data into the store.
 * No data is passed as props — this eliminates the prop→store→render loop.
 */
export function Chat({ currentUserId, onStartConversation, onBroadcast }: ChatProps) {
  const {
    conversations,
    messages,
    users,
    selectedConversation,
    setSelectedConversation,
    addMessage,
    toggleMute,
  } = useChat()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [newChatOpen, setNewChatOpen]         = useState(false)
  const [broadcastOpen, setBroadcastOpen]     = useState(false)
  const [broadcastContent, setBroadcastContent] = useState("")
  const [broadcastTargets, setBroadcastTargets] = useState<number[]>([])
  const [broadcasting, setBroadcasting]       = useState(false)
  const [userSearch, setUserSearch]           = useState("")
  const [starting, setStarting]               = useState<number | null>(null)

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }
    if (typeof window !== "undefined") window.addEventListener("resize", handleResize)
    return () => { if (typeof window !== "undefined") window.removeEventListener("resize", handleResize) }
  }, [])

  const currentConversation = conversations.find(c => c.id === selectedConversation)
  const currentMessages     = selectedConversation ? messages[selectedConversation] || [] : []

  const handleSendMessage = (content: string) => {
    if (!selectedConversation) return
    addMessage(selectedConversation, {
      id:        `msg-${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      senderId:  currentUserId,
      type:      "text",
      isEdited:  false,
      reactions: [],
      replyTo:   null,
    })
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) &&
    u.id !== currentUserId
  )

  const handleStartChat = async (targetUserId: number) => {
    if (!onStartConversation) return
    setStarting(targetUserId)
    try {
      await onStartConversation(targetUserId)
      setNewChatOpen(false)
      setUserSearch("")
    } finally {
      setStarting(null)
    }
  }

  const handleBroadcast = async () => {
    if (!onBroadcast || broadcastTargets.length === 0 || !broadcastContent.trim()) return
    setBroadcasting(true)
    try {
      await onBroadcast(broadcastTargets, broadcastContent.trim())
      setBroadcastOpen(false)
      setBroadcastContent("")
      setBroadcastTargets([])
    } finally {
      setBroadcasting(false)
    }
  }

  const toggleBroadcastTarget = (userId: number) => {
    setBroadcastTargets(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full min-h-[600px] max-h-[calc(100vh-200px)] flex rounded-lg border overflow-hidden bg-background">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`
          w-80 border-r bg-background flex-shrink-0 flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:relative lg:block fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
        `}>
          <div className="lg:hidden p-4 border-b flex items-center justify-between bg-background">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop header — no separate New Chat button, use the 3-dot menu in ConversationList */}
          <div className="hidden lg:flex items-center h-16 px-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>

          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onNewChat={onStartConversation ? () => setNewChatOpen(true) : undefined}
            onBroadcast={onBroadcast ? () => setBroadcastOpen(true) : undefined}
            onSelectConversation={(id) => {
              setSelectedConversation(id)
              setIsSidebarOpen(false)
            }}
          />

          {/* Mobile: New Chat via bottom button */}
          {onStartConversation && (
            <div className="lg:hidden p-3 border-t">
              <Button className="w-full gap-2" onClick={() => setNewChatOpen(true)}>
                <MessageSquarePlus className="h-4 w-4" /> New Chat
              </Button>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <div className="flex items-center h-16 px-4 border-b bg-background">
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)} className="lg:hidden mr-2">
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <ChatHeader
                conversation={currentConversation || null}
                users={users}
                onToggleMute={() => selectedConversation && toggleMute(selectedConversation)}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <MessageList messages={currentMessages} users={users} currentUserId={currentUserId} />
                <MessageInput
                  onSendMessage={handleSendMessage}
                  placeholder={`Message ${currentConversation?.name || ""}...`}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <MessageSquarePlus className="size-12 text-muted-foreground/30 mx-auto" />
                  <h3 className="text-lg font-semibold">No conversations yet</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    {onStartConversation ? 'Click "New Chat" to start a conversation.' : "Your conversations will appear here."}
                  </p>
                  {onStartConversation && (
                    <Button className="gap-2 mt-2" onClick={() => setNewChatOpen(true)}>
                      <MessageSquarePlus className="h-4 w-4" /> Start a Conversation
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <ScrollArea className="h-64">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {users.length === 0 ? "No contacts available yet." : "No results found."}
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
                      disabled={starting === Number(u.id)}
                      onClick={() => handleStartChat(Number(u.id))}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{u.role.toLowerCase()}</p>
                      </div>
                      {starting === Number(u.id) && (
                        <span className="ml-auto text-xs text-muted-foreground">Opening...</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog — admin only */}
      <Dialog open={broadcastOpen} onOpenChange={v => { setBroadcastOpen(v); if (!v) { setBroadcastTargets([]); setBroadcastContent("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a message to multiple users at once. Each recipient gets it as a direct message and a notification.
            </p>

            {/* Recipient selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Recipients ({broadcastTargets.length} selected)</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-44 rounded-md border">
                <div className="p-2 space-y-1">
                  {users.filter(u => u.id !== currentUserId && u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => {
                    const selected = broadcastTargets.includes(Number(u.id))
                    return (
                      <button
                        key={u.id}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${selected ? "bg-primary/10 border border-primary/30" : "hover:bg-accent"}`}
                        onClick={() => toggleBroadcastTarget(Number(u.id))}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-[10px] bg-muted font-semibold">
                            {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{u.role.toLowerCase()}</p>
                        </div>
                        {selected && <span className="text-xs text-primary font-semibold shrink-0">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Message</p>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Type your broadcast message..."
                value={broadcastContent}
                onChange={e => setBroadcastContent(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
              <Button
                disabled={broadcastTargets.length === 0 || !broadcastContent.trim() || broadcasting}
                onClick={handleBroadcast}
                className="gap-2"
              >
                {broadcasting ? "Sending..." : `Send to ${broadcastTargets.length} user${broadcastTargets.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

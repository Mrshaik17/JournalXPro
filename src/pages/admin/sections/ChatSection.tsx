import { useState, useEffect } from "react";
import {
  Send,
  MessageSquare,
  Search,
  Trash2,
  Phone,
  Video,
  MessageCircle,
  User,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ChatSection({
  chatUsers,
  selectedChatUser,
  setSelectedChatUser,
  chatMessages,
  chatReply,
  setChatReply,
  sendAdminReply,
  chatEndRef,
  deleteChatUser,
}: any) {
  const [search, setSearch] = useState("");
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Get selected user data or null
  const selectedUserData = chatUsers.find((user: any) => user.id === selectedChatUser);
  
  // Filter users for search
  const filteredUsers = chatUsers.filter((user: any) =>
    user.id.toLowerCase().includes(search.toLowerCase()) ||
    (user.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: chatUsers.length,
    unread: chatUsers.filter((user: any) => user.unreadCount > 0).length || 0,
    online: chatUsers.filter((user: any) => user.isOnline).length || 0,
  };

  const getUserInitials = (name: string) => {
    if (!name) return "ID";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const copyUserId = async (userId: string) => {
    await navigator.clipboard.writeText(userId);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Conversations
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Unread
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-400 tabular-nums">
            {stats.unread}
          </p>
        </div>
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Active
          </p>
          <p className="mt-2 text-xl font-semibold text-emerald-400 tabular-nums">
            {stats.online}
          </p>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="flex-1 grid lg:grid-cols-[340px_1fr] gap-5 h-[600px]">
        {/* Left: Users Sidebar */}
        <div className="space-y-3 flex flex-col h-full">
          <div className="rounded-2xl bg-card/75 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold">Chat Users ({chatUsers.length})</h3>
            </div>
            
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by ID, name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-0 bg-background/70 pl-10 shadow-none focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex-1 rounded-2xl bg-card/70 shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="p-3 border-b border-border/50 bg-card/80">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
                Recent Conversations
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <User className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  <p className="mb-2">No users found</p>
                  <p className="text-xs text-muted-foreground/70">Try a different search</p>
                </div>
              ) : (
                filteredUsers.map((user: any) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedChatUser(user.id)}
                    className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedChatUser === user.id
                        ? "bg-primary/10 text-primary border-2 border-primary/20 ring-2 ring-primary/10"
                        : "hover:bg-background/50 text-foreground"
                    }`}
                  >
                    <Avatar className="h-11 w-11 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold text-sm">
                        {getUserInitials(user.name || user.id)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate pr-2">
                            {user.name || user.id}
                          </p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground truncate pr-2">
                              {user.email}
                            </p>
                          )}
                        </div>
                        {user.isOnline && (
                          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background ml-auto" />
                        )}
                      </div>
                      
                      {user.unreadCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {user.previewMessage || "New messages"}
                          </span>
                          <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium tabular-nums min-w-[20px] h-5 flex items-center justify-center">
                            {user.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground tabular-nums ml-auto text-right min-w-[50px]">
                      {user.lastMessageTime && new Date(user.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Chat Area */}
        <div className="space-y-3 flex flex-col h-full">
          {selectedChatUser ? (
            <>
              {/* User Header */}
              <div className="rounded-2xl bg-card/75 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold text-lg">
                      {getUserInitials(selectedUserData?.name || selectedChatUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {selectedUserData?.name || selectedChatUser}
                      </h3>
                      {selectedUserData?.isOnline && (
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background" />
                      )}
                    </div>
                    {selectedUserData?.email && (
                      <p className="text-xs text-muted-foreground truncate">{selectedUserData.email}</p>
                    )}
                    <button
                      onClick={() => copyUserId(selectedChatUser)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
                      title="Copy user ID"
                    >
                      <span className="font-mono truncate max-w-[200px]">{selectedChatUser}</span>
                      {copiedUserId === selectedChatUser ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete chat with ${selectedUserData?.name || selectedChatUser}?`)) {
                          deleteChatUser(selectedChatUser);
                          setSelectedChatUser(null);
                        }
                      }}
                      title="Delete chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 rounded-2xl bg-card/70 shadow-sm overflow-hidden flex flex-col min-h-0">
                <div className="p-4 border-b border-border/50 bg-card/80 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
                    Messages ({chatMessages.length})
                  </p>
                </div>
                
                <div ref={chatEndRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground py-12">
                      <MessageCircle className="h-16 w-16 mb-6 text-muted-foreground/50" />
                      <p className="mb-2 font-medium">No messages yet</p>
                      <p className="text-xs text-muted-foreground/70 max-w-sm text-center">
                        Start the conversation by sending your first reply.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                            msg.sender === "admin"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary/80 text-foreground rounded-bl-sm border"
                          }`}
                        >
                          <div className="text-xs opacity-75 mb-1 uppercase font-medium tracking-wide">
                            {msg.sender === "admin" ? "You" : "User"}
                          </div>
                          <div>{msg.message}</div>
                          <div className="text-xs opacity-75 mt-2 font-mono tabular-nums">
                            {new Date(msg.created_at).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Composer */}
                <div className="p-4 border-t border-border/50 bg-card/80">
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 min-h-[44px] max-h-24 rounded-xl border-0 bg-background/70 focus-visible:ring-1 resize-none"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendAdminReply();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={sendAdminReply}
                      disabled={!chatReply.trim()}
                      className="h-11 w-11 rounded-xl p-0 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 rounded-2xl bg-card/70 p-12 shadow-sm flex flex-col items-center justify-center text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-6" />
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                No chat selected
              </h3>
              <p className="text-xs text-muted-foreground mb-8 max-w-sm mx-auto">
                Choose a user from the left sidebar to view their messages and start chatting.
              </p>
              <div className="text-xs text-muted-foreground/70 space-y-1">
                <p>• Click any user to open conversation</p>
                <p>• Reply instantly with Enter key</p>
                <p>• Delete chats with trash icon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
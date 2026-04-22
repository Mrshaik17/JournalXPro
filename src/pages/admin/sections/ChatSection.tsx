import { useMemo, useState } from "react";
import { MessageSquare, Search, Send, Mail, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatUser = {
  id: string;
  email: string;
  full_name?: string;
  latest_message_at?: string;
};

type ChatMessage = {
  id: string;
  sender: "user" | "admin" | "bot";
  message: string;
  created_at: string;
};

type Props = {
  chatUsers: ChatUser[];
  selectedChatUser: string | null;
  setSelectedChatUser: (id: string) => void;
  selectedChatUserDetails?: ChatUser | null;
  chatMessages: ChatMessage[];
  chatReply: string;
  setChatReply: (value: string) => void;
  sendAdminReply: () => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
};

export default function AdminChatSection({
  chatUsers,
  selectedChatUser,
  setSelectedChatUser,
  selectedChatUserDetails,
  chatMessages,
  chatReply,
  setChatReply,
  sendAdminReply,
  chatEndRef,
}: Props) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return chatUsers.filter((user) => {
      if (!q) return true;

      return (
        user.full_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q)
      );
    });
  }, [chatUsers, search]);

  const unreadCount = 0;
  const activeCount = selectedChatUser ? 1 : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Chat</h2>
        <p className="text-sm text-muted-foreground">
          Manage platform conversations and reply to users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Conversations
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{chatUsers.length}</p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Unread
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-400">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl bg-card/70 px-4 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Active
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-400">
            {activeCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="rounded-2xl bg-card/70 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Chat Users ({chatUsers.length})</h3>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by ID, name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl border-0 bg-background/70 pl-10 shadow-none focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-card/70 shadow-sm">
            <div className="border-b border-border/50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Recent Conversations
              </p>
            </div>

            <div className="space-y-3 p-3">
              {filteredUsers.map((user) => {
                const isActive = selectedChatUser === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedChatUser(user.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border/40 bg-background/40 hover:bg-background/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {(user.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {user.full_name || "User"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email || user.id}
                        </p>
                        {user.latest_message_at && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {new Date(user.latest_message_at).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="rounded-2xl bg-background/40 px-4 py-10 text-center text-sm text-muted-foreground">
                  No chat users found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card/70 shadow-sm min-h-[560px]">
          {selectedChatUser ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserCircle2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {selectedChatUserDetails?.full_name || "User"}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {selectedChatUserDetails?.email || selectedChatUser}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chatMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                    No messages yet for this user.
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          msg.sender === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/70 text-foreground border border-border/40"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(msg.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-border/50 p-4">
                <div className="flex gap-2">
                  <Input
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="h-11 rounded-xl border-0 bg-background/70 shadow-none focus-visible:ring-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAdminReply();
                      }
                    }}
                  />
                  <Button onClick={sendAdminReply} className="h-11 rounded-xl px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[560px] flex-col items-center justify-center px-6 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold text-foreground">No chat selected</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Choose a user from the left sidebar to view their messages and start replying.
              </p>

              <div className="mt-6 space-y-1 text-xs text-muted-foreground">
                <p>- Click any user to open conversation</p>
                <p>- Reply instantly with Enter key</p>
                <p>- User email is shown in the chat header</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
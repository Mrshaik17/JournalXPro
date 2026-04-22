import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const intents = [
  {
    keywords: ["price", "cost", "pricing", "premium", "discount", "plan"],
    response:
      "Our pricing depends on the plan you choose — Pro ($5), Pro+ ($10), or Elite ($14). Let me know which interests you!",
  },
  {
    keywords: ["payment failed", "money deducted", "paid but not", "transaction failed"],
    response:
      "Don't worry! Sometimes payment takes a few minutes to reflect. Please share your transaction ID or screenshot — I'll verify it quickly.",
  },
  {
    keywords: ["can't login", "login not working", "unable to sign", "login issue"],
    response:
      "Please try refreshing the page, clearing cache, and logging in again. If the issue continues, I'll connect you to live support.",
  },
  {
    keywords: ["otp not", "signup not", "verification email"],
    response:
      "Please check your spam/junk folder. If you still didn't receive it, let me know your email and I'll help.",
  },
  {
    keywords: ["no access", "not activated", "can't access"],
    response:
      "Sorry for the delay 🙏 Please share your registered email or payment proof — I'll get your access activated.",
  },
  {
    keywords: ["not loading", "page not", "blank screen", "site down"],
    response:
      "Please try refreshing or opening in another browser. Also try switching network. If it continues, contact live support.",
  },
  {
    keywords: ["mobile", "phone", "ui broken"],
    response:
      "Try opening in Chrome or updating your browser. We're continuously improving mobile experience.",
  },
  {
    keywords: ["refund", "money back"],
    response:
      "Refunds depend on our policy. Please share your issue — we'll check and provide the best solution.",
  },
  {
    keywords: ["forgot password", "reset password"],
    response:
      "Click on 'Forgot Password' on the login page and follow the steps. If email not received, I'll help you manually.",
  },
  {
    keywords: ["data not saved", "journal missing", "entry not showing"],
    response:
      "Please refresh once and check again. If still missing, contact live support — we'll check the backend.",
  },
  {
    keywords: ["beginner", "new to trading"],
    response:
      "Welcome! Beginners are absolutely welcome. We guide from basics to advanced. Start by creating an account and logging your first trade!",
  },
  {
    keywords: ["signal", "signals"],
    response:
      "We focus on teaching discipline through journaling, not just signals. Our tools help you become a better trader.",
  },
  {
    keywords: ["urgent", "asap", "immediately"],
    response:
      "I understand this is urgent. Let me prioritize this for you — please share the details and I'll connect you to live support.",
  },
  {
    keywords: ["bad", "waste", "worst", "frustrating"],
    response:
      "I understand your frustration. Let me help fix this quickly. Please share the details.",
  },
  {
    keywords: ["hi", "hello", "hey", "hii"],
    response: "Hi! Welcome to JournalXPro Support. How can I help you today?",
  },
];

const getAutoResponse = (msg: string): string | null => {
  const lower = msg.toLowerCase();

  for (const intent of intents) {
    if (intent.keywords.some((k) => lower.includes(k))) {
      return intent.response;
    }
  }

  return null;
};

interface ChatMessage {
  id: string;
  user_id?: string;
  message: string;
  sender: "user" | "admin" | "bot";
  created_at: string;
}

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [liveRequested, setLiveRequested] = useState(false);
  const [missCount, setMissCount] = useState(0);
  const { user } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const upsertMessage = (message: ChatMessage) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) {
        return prev.map((m) => (m.id === message.id ? message : m));
      }

      const next = [...prev, message];
      next.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return next;
    });
  };

  const addLocalBotMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-bot`,
        message,
        sender: "bot",
        created_at: new Date().toISOString(),
      },
    ]);
    scrollToBottom();
  };

  useEffect(() => {
    if (!user || !open) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const rows = (data || []) as any[];

      setMessages(
        rows.map((m) => ({
          id: m.id,
          user_id: m.user_id,
          message: m.message,
          sender: m.sender as "user" | "admin" | "bot",
          created_at: m.created_at,
        }))
      );

      if (rows.some((m) => m.sender === "admin")) {
        setIsLive(true);
        setLiveRequested(false);
      }

      scrollToBottom();
    };

    fetchMessages();

    const channel = supabase
      .channel(`user-chat-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as ChatMessage;
            upsertMessage(row);

            if (row.sender === "admin") {
              setIsLive(true);
              setLiveRequested(false);
              setMissCount(0);

              try {
                new Audio(
                  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgkK3nGhEPGOQr7uidVI9Y4xtZthOkBskK22q2E5"
                ).play();
              } catch {}
            }

            scrollToBottom();
          }

          if (payload.eventType === "UPDATE") {
            const row = payload.new as ChatMessage;
            upsertMessage(row);
          }

          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as ChatMessage;
            setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, open]);

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const msg = input.trim();
    setInput("");

    if (user) {
      const { data, error } = await supabase
        .from("support_messages")
        .insert({
          user_id: user.id,
          sender: "user",
          message: msg,
        })
        .select()
        .single();

      if (error) return;

      if (data) {
        upsertMessage(data as ChatMessage);
        scrollToBottom();
      }

      const autoReply = getAutoResponse(msg);

      if (autoReply) {
        setMissCount(0);

        setTimeout(() => {
          addLocalBotMessage(autoReply);
        }, 500);

        return;
      }

      const nextMiss = missCount + 1;
      setMissCount(nextMiss);

      if (!isLive && !liveRequested) {
        if (nextMiss === 1) {
          setTimeout(() => {
            addLocalBotMessage(
              "I'm not fully understanding your issue. Could you please rephrase it once?"
            );
          }, 500);
        } else if (nextMiss === 2) {
          setTimeout(() => {
            addLocalBotMessage(
              "I still couldn't match that exactly. Please share a bit more detail so I can help better."
            );
          }, 500);
        } else if (nextMiss === 3) {
          setTimeout(() => {
            addLocalBotMessage(
              "I'm still unable to resolve this properly. One more message from you and I'll connect you to live support, Or send us mail at Journalxpro@gmail.com."
            );
          }, 500);
        } else if (nextMiss >= 4) {
          setLiveRequested(true);

          setTimeout(() => {
            addLocalBotMessage(
              "I'm connecting you to live support now. Please wait a moment — our team will respond shortly."
            );
          }, 500);
        }
      }

      return;
    }

    const localUserMsg: ChatMessage = {
      id: `${Date.now()}-guest`,
      message: msg,
      sender: "user",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, localUserMsg]);
    scrollToBottom();

    const autoReply = getAutoResponse(msg);

    if (autoReply) {
      setMissCount(0);

      setTimeout(() => {
        addLocalBotMessage(autoReply);
      }, 500);

      return;
    }

    const nextMiss = missCount + 1;
    setMissCount(nextMiss);

    if (!liveRequested) {
      if (nextMiss === 1) {
        setTimeout(() => {
          addLocalBotMessage(
            "I'm not fully understanding your issue. Could you please rephrase it once?"
          );
        }, 500);
      } else if (nextMiss === 2) {
        setTimeout(() => {
          addLocalBotMessage(
            "I still couldn't match that exactly. Please share a bit more detail so I can help better."
          );
        }, 500);
      } else if (nextMiss === 3) {
        setTimeout(() => {
          addLocalBotMessage(
            "I'm still unable to resolve this properly. One more message from you and I'll connect you to live support, Or send us mail at Journalxpro@gmail.com."
          );
        }, 500);
      } else if (nextMiss >= 4) {
        setLiveRequested(true);

        setTimeout(() => {
          addLocalBotMessage(
            "I'm connecting you to live support now. Please wait a moment — our team will respond shortly."
          );
        }, 500);
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
            aria-label="Open support chat"
          >
            <MessageSquare className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">JournalXPro Support</span>
                {isLive && (
                  <span className="h-2 w-2 rounded-full animate-pulse bg-green-400" />
                )}
              </div>

              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close support chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <p className="mb-1 font-semibold">Welcome!</p>
                  <p>How can we help you today?</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-80 rounded-lg px-3 py-2 text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : m.sender === "admin"
                          ? "border border-green-500/20 bg-green-500/10 text-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {m.sender === "admin" && (
                        <span className="mb-0.5 block text-[9px] font-semibold text-green-400">
                          Live Support
                        </span>
                      )}
                      {m.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-border p-3">
              {!user ? (
                <p className="w-full py-2 text-center text-xs text-muted-foreground">
                  Please{" "}
                  <a href="/login" className="text-primary underline">
                    sign in
                  </a>{" "}
                  to chat with us.
                </p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="border-border bg-background text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                  />
                  <Button size="sm" onClick={sendMessage} className="px-3">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
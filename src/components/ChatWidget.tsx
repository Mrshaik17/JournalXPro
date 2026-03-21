import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Intent matching for chatbot
const intents = [
  { keywords: ["price", "cost", "pricing", "premium", "discount", "plan"], response: "Our pricing depends on the plan you choose — Pro ($5), Pro+ ($10), or Elite ($14). Let me know which interests you!" },
  { keywords: ["payment failed", "money deducted", "paid but not", "transaction failed"], response: "Don't worry! Sometimes payment takes a few minutes to reflect. Please share your transaction ID or screenshot — I'll verify it quickly." },
  { keywords: ["can't login", "login not working", "unable to sign", "login issue"], response: "Please try refreshing the page, clearing cache, and logging in again. If the issue continues, I'll connect you to live support." },
  { keywords: ["otp not", "signup not", "verification email"], response: "Please check your spam/junk folder. If you still didn't receive it, let me know your email and I'll help." },
  { keywords: ["no access", "not activated", "can't access"], response: "Sorry for the delay 🙏 Please share your registered email or payment proof — I'll get your access activated." },
  { keywords: ["not loading", "page not", "blank screen", "site down"], response: "Please try refreshing or opening in another browser. Also try switching network. If it continues, contact live support." },
  { keywords: ["mobile", "phone", "ui broken"], response: "Try opening in Chrome or updating your browser. We're continuously improving mobile experience." },
  { keywords: ["refund", "money back"], response: "Refunds depend on our policy. Please share your issue — we'll check and provide the best solution." },
  { keywords: ["forgot password", "reset password"], response: "Click on 'Forgot Password' on the login page and follow the steps. If email not received, I'll help you manually." },
  { keywords: ["data not saved", "journal missing", "entry not showing"], response: "Please refresh once and check again. If still missing, contact live support — we'll check the backend." },
  { keywords: ["beginner", "new to trading"], response: "Welcome! Beginners are absolutely welcome. We guide from basics to advanced. Start by creating an account and logging your first trade!" },
  { keywords: ["signal", "signals"], response: "We focus on teaching discipline through journaling, not just signals. Our tools help you become a better trader." },
  { keywords: ["urgent", "asap", "immediately"], response: "I understand this is urgent. Let me prioritize this for you — please share the details and I'll connect you to live support." },
  { keywords: ["bad", "waste", "worst", "frustrating"], response: "I understand your frustration 🙏 Let me help fix this quickly. Please share the details." },
];

const getAutoResponse = (msg: string): string | null => {
  const lower = msg.toLowerCase();
  for (const intent of intents) {
    if (intent.keywords.some((k) => lower.includes(k))) return intent.response;
  }
  return null;
};

interface ChatMessage {
  id: string;
  message: string;
  sender: "user" | "admin" | "bot";
  created_at: string;
}

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [missCount, setMissCount] = useState(0);
  const { user } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load chat messages from DB if logged in
  useEffect(() => {
    if (!user || !open) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("support_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({ id: m.id, message: m.message, sender: m.sender as any, created_at: m.created_at })));
        setIsLive(true);
      }
    };
    fetchMessages();

    const channel = supabase.channel(`user-chat-${user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${user.id}` }, (payload: any) => {
      if (payload.new?.sender === "admin") {
        setMessages((prev) => [...prev, { id: payload.new.id, message: payload.new.message, sender: "admin", created_at: payload.new.created_at }]);
        // Play notification sound
        try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgkK+3nGhEPGOQr7uidVI9Y4+xtZthOkBskK22q2E5").play(); } catch {}
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, open]);

  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");

    const newMsg: ChatMessage = { id: Date.now().toString(), message: msg, sender: "user", created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, newMsg]);

    if (user) {
      // Save to DB
      await supabase.from("support_messages").insert({ user_id: user.id, sender: "user", message: msg });
    }

    if (!isLive) {
      // Try auto-response
      const autoReply = getAutoResponse(msg);
      if (autoReply) {
        setTimeout(() => {
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-bot", message: autoReply, sender: "bot", created_at: new Date().toISOString() }]);
        }, 600);
        setMissCount(0);
      } else {
        const newMiss = missCount + 1;
        setMissCount(newMiss);
        if (newMiss >= 2) {
          setTimeout(() => {
            setMessages((prev) => [...prev, { id: Date.now().toString() + "-bot", message: "I'm connecting you to live support. Please wait a moment — our team will respond shortly! 🙏", sender: "bot", created_at: new Date().toISOString() }]);
            setIsLive(true);
          }, 600);
        } else {
          setTimeout(() => {
            setMessages((prev) => [...prev, { id: Date.now().toString() + "-bot", message: "I'm not fully understanding your issue. Could you please rephrase or provide more details?", sender: "bot", created_at: new Date().toISOString() }]);
          }, 600);
        }
      }
    }
  };

  return (
    <>
      {/* Float button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <MessageSquare className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Trader's Divine Support</span>
                {isLive && <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">
                  <p className="font-semibold mb-1">👋 Welcome!</p>
                  <p>How can we help you today?</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    m.sender === "user" ? "bg-primary text-primary-foreground" :
                    m.sender === "admin" ? "bg-green-500/10 text-foreground border border-green-500/20" :
                    "bg-secondary text-foreground"
                  }`}>
                    {m.sender === "admin" && <span className="text-[9px] text-green-400 font-semibold block mb-0.5">Live Support</span>}
                    {m.message}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              {!user ? (
                <p className="text-xs text-muted-foreground text-center w-full py-2">Please <a href="/login" className="text-primary underline">sign in</a> to chat with us.</p>
              ) : (
                <>
                  <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="bg-background border-border text-xs" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <Button size="sm" onClick={sendMessage} className="px-3"><Send className="h-3.5 w-3.5" /></Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

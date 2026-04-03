import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mail } from "lucide-react";

export const ContactSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) { toast.error("All fields required"); return; }
    setSending(true);
    try {
      const { error } = await supabase.from("contact_messages" as any).insert({ name, email, message } as any);
      if (error) throw error;
      toast.success("Message sent! We'll get back to you soon.");
      setName(""); setEmail(""); setMessage("");
    } catch {
      toast.error("Failed to send message. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 border-t border-border">
      <div className="container px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground">Have a question? Send us a message and we'll respond shortly.</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span>support@journalxpro.com</span>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="bg-background border-border" required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email *</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" type="email" className="bg-background border-border" required />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Message *</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" className="bg-background border-border" rows={4} required />
          </div>
          <Button type="submit" disabled={sending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </motion.form>
      </div>
    </section>
  );
};
